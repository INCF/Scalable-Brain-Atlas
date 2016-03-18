<?php
require_once('../lib/runtime.php');

/*
 * class lib_class
 */
class lib_class {
  /*
   * Lists, for each library function, to which groups of users it is available.
   * Undefined means not available; empty string means available to all.
   */
  protected $functionAvailableTo = array(
    'prepareLogin' => '',
    'doLogin' => '',
    'currentUser' => '',
    'logout' => '',
    'requirePermission' => ''
  );
  
  /* 
   * Generates error if the current permissions (as stored in session variable) 
   * do not contain $level
   */
  function requirePermission($level,$docPath) {
    global $phpRequest;
    $lib = $phpRequest->lib;
    $permissions = @join(' ',$_SESSION[$lib]['permissions']);
    if (!preg_match('/'.$level.'\b/',$permissions)) {
      exit('You need "'.$level.'" permissions to view '.basename($docPath).', but your permissions are: "'.$permissions.'"');
    }
  }
  
  /* 
   * Generates error if the current permissions (as stored in session variable) 
   * are insufficient to call $func
   */
  function requireFunction($func) {
    global $phpRequest;
    $lib = $phpRequest->lib;
    $permissions = @join(' ',$_SESSION[$lib]['permissions']);
    $availableTo = $this->functionAvailableTo[$func];
    if (isset($availableTo)) {
      if ($availableTo == '' || preg_match('/'.$availableTo.'\b/',$permissions)) {
        return true;
      }
    }
    phpLibError('You have no permission to call '.$func.', your permissions are: "'.$permissions.'"');
  }

  /* 
   * Retrieves stored password for $user 
   * Function to be overloaded by child library
   */
  function getStoredPwd($user) {
    global $phpRequest;
    $lib = $phpRequest->lib;
    return substr(crypt('qwerty',substr($lib,0,2)),2);
  }

  /* 
   * Combines stored password with previously generated challenge into encrypted response.
   * The same function is implemented on the client-side.
   */
  function getDesiredResponse($pwd_stored,$challenge) {
    $ans = $pwd_stored;
    for ($i=0;$i<8;$i++) $ans = substr(crypt($ans,substr($challenge,2*$i,2)),2);
    return $ans;
  }
  
  /* 
   * Returns the permissions for an existing user who typed the correct password
   */
  function getPermissions($valid_user) {
    return array('guest');
  }
  
  /* 
   * Sends a randomly generated challenge to the client. The client combines the 
   * typed password with this challenge into an encrypted response.
   */
  function prepareLogin($user) {
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $num_chars = strlen($chars);
    global $phpRequest;
    $lib = $phpRequest->lib;
    $challenge = '';
    for ($c=0;$c<16;$c++) $challenge .= substr($chars,rand(0,$num_chars-1),1);
    $_SESSION[$lib]['user'] = $user;
    $_SESSION[$lib]['challenge'] = $challenge;    
    return $challenge;
  }
  
  /*
   * Compares the client reponse to the desired response, given the
   * previously generated challenge.
   * On match, store the user's permissions as a session variable.
   */
  function doLogin($response) {
    global $phpRequest;
    $lib = $phpRequest->lib;
    if (!isset($_SESSION[$lib])) return array('errorMsg'=>'session error, does your browser accept session cookies?');
    $user = $_SESSION[$lib]['user'];
    if (strlen($response) && strlen($user)) {
      $challenge = $_SESSION[$lib]['challenge'];
      if (strlen($challenge)) {
        $pwd_crypt = $this->getStoredPwd($user);
        if (strlen($pwd_crypt)) {
          $desiredResponse = $this->getDesiredResponse($pwd_crypt,$challenge);
          if ($response == $desiredResponse) {
            $permissions = $this->getPermissions($user);
            $_SESSION[$lib]['permissions'] = $permissions;
            return array('errorMsg'=>'','permissions'=>join(' ',$permissions));
          } else {
            $_SESSION[$lib]['user'] = null;
            $_SESSION[$lib]['permissions'] = null;
          }
        }
      }
    }
    $this->logout();
    return array('errorMsg'=>'no match');
  }
  
  /*
   * Returns current user, as stored in the library's session variable
   */
  function currentUser() {
    global $phpRequest;
    $lib = $phpRequest->lib;
    $user = $_SESSION[$lib]['user'];
    return (isset($user) ? $user : '');
  }

  /*
   * Discard all session information for this library
   */
  function logout() {
    global $phpRequest;
    $lib = $phpRequest->lib;
    unset($_SESSION[$lib]);
  }
}
?>