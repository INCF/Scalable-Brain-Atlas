<?php 
class formfields_class {
  public $fields = array();
  
  function headSection() {
    return 
      '<link rel="stylesheet" href="../shared-css/formfields.css" type="text/css"/>'.
      '<!--script type="text/javascript">'.
      'browser.include_script_once(\'../shared-js/formfields.js\');'.
      'browser.include_style_once(\'../shared-css/formfields.css\')'.
      '</script-->';
  }
  
  // parses (corrects) all values and returns array of error messages (which should be empty)
  function parseAndValidateInputs(&$values) {
    $errs = array();
    foreach($this->fields as $k=>$v) {
      $err = $v->parseAndValidate($values[$k]);
      if (is_string($err)) $errs[$k] = $err;
    }
    return $errs;
  }
  
  // field must be derived from anyField_class
  function addField($name,$field) {
    $field->setName($name);
    $this->fields[$name] = $field;
  }
  
  function fieldHtml($name,$value=NULL) {
    return $this->fields[$name]->fieldHtml($value);
  }
  
  function formAsTableRows($lastValues) {
    $ans = '';
    foreach ($this->fields as $key=>$field) {
      $inp = $field->fieldHtml_start().$field->fieldHtml(@$lastValues[$key]).$field->fieldHtml_end();
      if (isset($inp)) {
        $class = '';
        $label = @$field->label;
        if (isset($label)) {
          if ($field->readOnly) $class = ' class="comment"';
          $ans .= '<tr><td'.$class.'>'.$field->label.'</td><td>:</td><td'.$class.'>'.$inp.'</td></tr>';
        } else $ans .= $inp;
      } else $ans .= '<tr><td colspan="3" class="comment">'.$field->label.'</td></tr>';
    }
    return $ans;
  }
  
  function errorReport($errs) {
    $ans = '<html>Form errors:<ul>';
    foreach($errs as $k=>$err) {
      $ans .= '<li>Field <b>'.$k.'</b>: '.$err;
    }
    $ans .= '</ul></html>';
    return $ans;
  }
}

class anyField_class {
  public $label;
  public $readOnly;
  public $name;
  public $errors = array();
  protected $attrs;
  protected $defaultValue;
  
  function __construct($label,$attrs=NULL) {
    $this->label = $label;
    $this->attrs = (isset($attrs) ? $attrs : array());
    $this->readOnly = false;
  }

  // parses (corrects) value and returns error message or NULL
  function parseDefault(&$value) {
    if (!isset($value)) {
      if (isset($this->defaultValue)) $value = $this->defaultValue;
      else return 'Missing value for required entry';
    }
  }
  
  // parses (corrects) value and returns error message or NULL
  function parseAndValidate(&$value) {
    return $this->parseDefault($value);
  }
  
  function addAttr($key,$value) {
    $this->attrs[$key] = $value;
  }
  
  function setName($name) {
    $this->name = $name;
  }
  
  function setDefault($value) {
    $this->defaultValue = $value;
  }
  
  function setReadOnly($yn=TRUE) {
    $this->readOnly = $yn;
  }
  
  function addError($err) {
    $this->errors[] = $err;  
  }
  
  // nothing entered
  function isEmpty($formVal) {
    return trim($formVal) === '';
  }
  
  // store as NULL in the database
  function isNull($formVal) {
    return $this->isEmpty($formVal);
  }

  function fieldHtml_start() {
    $ans = '';
    foreach ($this->errors as $err) {
      $ans .= '<div class="ff_error_box">';
      $ans .= '<div class="ff_error_msg">'.$err.'</div>';
    }
    return $ans;
  }
  
  function fieldHtml_end() {
    return ($this->errors ? '' : '</div>');
  }

  function fieldHtml($value=NULL) {
    $ans = '';
    if (!isset($value)) $value = $this->defaultValue;
    if ($this->readOnly) {
      $ans .= htmlspecialchars($value).'<input type="hidden" ';
    } else {
      $ans .= '<input ';
      foreach($this->attrs as $k=>$v) {
        $ans .= $k.'="'.$v.'" ';
      }
    }
    $ans .= 'name="'.$this->name.'" ';
    if (isset($value)) $ans .= 'value="'.htmlspecialchars($value).'"';
    $ans .= '/>';
    return $ans;
  }
}

class multiField_class extends anyField_class {
  protected $sep;

  function setSeparator($sep) {
    $this->sep = $sep;
  }
  
  function parseAndValidate1(&$value) {
    return parent::parseAndValidate($value);
  }
  
  function parseAndValidate(&$csv) {
    if (isset($this->sep)) {
      $csv = explode($this->sep,$csv);
      foreach ($csv as &$v) {
        $err = $this->parseAndValidate1($v);
        if ($err) return $err;
      }
    } else {
      return $this->parseAndValidate1($csv);
    }
  }
}

class textField_class extends multiField_class {
  function __construct($label,$attrs=array(),$minLen=0,$maxLen=1000,$yesPattern=NULL,$noPattern=NULL) {
    if (!isset($attrs['size'])) $attrs['size'] = ($maxLen > 40 ? 40 : $maxLen);
    $attrs['type'] = 'text';
    parent::__construct($label,$attrs);
    if ($minLen == 0) $this->defaultValue = '';
    $this->minLen = $minLen;
    $this->maxLen = $maxLen;
    $this->yesPattern = $yesPattern;
    $this->noPattern = $noPattern;
  }
  
  // parses (corrects) value and returns error message or NULL
  function parseAndValidate1(&$value) {
    if ($err = $this->parseDefault($value)) return $err;
    if (strlen($value)<$this->minLen) return 'Entry has length '.strlen($value).', minimum is '.$this->minLen;
    if (strlen($value)>$this->maxLen) return 'Entry has length '.strlen($value).', maximum is '.$this->maxLen;
    if (isset($this->yesPattern) && !preg_match($this->yesPattern,$value)) return 'Entry does not meet required pattern '.$this->yesPattern;
    if (isset($this->noPattern) && preg_match($this->noPattern,$value)) return 'Entry contains forbidden characters '.$this->noPattern;
    if (isset($this->forceSuggestion) && $this->forceSuggestion==TRUE) return $this->validateSuggestion($value);
    return;
  }
  
  function validateSuggestion($value) {
    $flipped = array_flip($this->suggestions);
    if (isset($flipped[$value]) == FALSE) return 'Entry "'.$value.'" is not among the list of suggestions';
  }
  
  function setSuggestions($sug,$forceSuggestion=FALSE) {
    $this->suggestions = $sug;
    $this->forceSuggestion = $forceSuggestion;
  }
}

class pwdField_class extends textField_class {
  function __construct($label,$attrs=array(),$minLen=6,$maxLen=20) {
    parent::__construct($label,$attrs,$minLen,$maxLen);
    $attrs['type'] = 'password';
  }
}

class emailField_class extends textField_class {
  function __construct($label,$attrs=array(),$minLen=0,$maxLen=1000) {
    $yesPattern = '/^[\w\d\.]*@[\w\d\.]*$/u';
    parent::__construct($label,$attrs,$minLen,$maxLen,$yesPattern);
  }
}

class numField_class extends multiField_class {
  function __construct($label,$attrs=array(),$minVal=NULL,$maxVal=NULL) {
    $attrs['type'] = 'text';
    parent::__construct($label,$attrs);
    $this->minVal = $minVal;
    $this->maxVal = $maxVal;
  }
  
  // parses (corrects) value and returns error message or NULL
  function parseAndValidate1(&$value) {
    if ($err = $this->parseDefault($value)) return $err;
    if (isset($this->minVal) && $value<$this->minVal) return 'Entry has value '.$value.', minimum is '.$this->minVal;
    if (isset($this->maxVal) && $value>$this->maxVal) return 'Entry has value '.$value.', maximum is '.$this->maxVal;
    return;
  }
}

class selectField_class extends anyField_class {
  function __construct($label,$attrs=array(),$choices=array(),$selected=NULL) {
    // if (!isset($attrs['size'])) $attrs['size'] = $maxLen;
    parent::__construct($label,$attrs);
    $this->setChoices($choices,$selected);
  }
  
  function setChoices($choices,$selected=NULL) {
    $this->groupChoices = $choices;
    foreach ($choices as $k=>$v) {
      if (is_array($v)) {
        foreach($v as $m=>$w) {
          $choices[$m] = $w;
        }
        unset($choices[$k]);
      }
    }
    $this->choices = $choices;
    if (isset($selected)) {
      $this->selected = array($selected=>TRUE);
      $this->defaultValue = $selected;
    } else {
      $this->selected = array();
    }
    //if (is_array($selected)) $this->selected = array_fill_keys($selected,1);
  }
  
  function setDefault($value) {
    parent::setDefault($value);
    $this->selected = array($value=>1);
  }
  
  function getChoiceTitle($key) {
    return $this->choices[$key];
  }
  
  function parseAndValidateChoice(&$value) {
    if (!isset($this->choices[$value])) {
      $keys = array_keys($this->choices);
      $lc2choice = array_combine(array_map('strtolower',$keys),$keys);
      $v = @$lc2choice[strtolower($value)];
      if (isset($v)) $value = $v;
      else return 'Option "'.$value.'" is not allowed';
    }
  }
  
  function parseAndValidate(&$value) {
    if ($err = $this->parseDefault($value)) return $err;
    return $this->parseAndValidateChoice($value);
  }
  
  function fieldHtml($value=NULL) {
    if ($this->readOnly) {
      // now works only when default value is set
      $selected = $this->defaultValue;
      $value = $this->choices[$selected];
      $ans = htmlspecialchars($value).'<input type="hidden" value="'.str_replace('"','\"',$selected).'" name="'.$this->name.'">';
      return $ans;
    }
    $ans = '<select ';
    foreach($this->attrs as $k=>$v) {
      $ans .= $k.'="'.$v.'" ';
    }
    $ans .= 'name="'.$this->name.'">';
    $selected = $this->selected;
    if (isset($value) && isset($this->choices[$value])) $selected = array($value=>1);
    foreach($this->groupChoices as $k=>$v) {
      if (is_array($v)) {
        $ans .= '<optgroup label="'.str_replace('"','\"',$k).'">';
        foreach($v as $m=>$w) {
          $ans .= '<option value="'.str_replace('"','\"',$m).'"'.(@$selected[$m] ? ' selected>' : '>').$w.'</option>';
        }
        $ans .= '<optgroup>';
      } else {
        $ans .= '<option value="'.htmlspecialchars($k).'"'.(@$selected[$k] ? ' selected>' : '>').htmlspecialchars($v).'</option>';
      }
    }
    $ans .= '</select>';
    return $ans;
  }
}

class checkField_class extends anyField_class {
  function __construct($label) {
    $attrs = array('type'=>'checkbox');
    parent::__construct($label,$attrs);
  }

  function fieldHtml($value=NULL) {
    if ($value) $this->attrs['checked'] = 'checked';
    else unset($this->attrs['checked']);
    return parent::fieldHtml($value);
  }
}

class hiddenField_class extends anyField_class {
  function __construct($value=1) {
    $attrs = array('type'=>'hidden');
    parent::__construct(NULL,$attrs);
    $this->setDefault($value);
  }
}

class commentField_class extends anyField_class {
  function fieldHtml($value=NULL) {
    return $value;
  }

  function parseAndValidate(&$value) {
    return;
  }
}
?>