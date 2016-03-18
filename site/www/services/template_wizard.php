<?php
?>
<html>
USE shared app lib for this.
This template_wizard is experimental and incomplete.
<p/>
<form name="template" method="get" action="template_wizard.php">
<br/>Template abbreviation: <input name="template" type="text" value="">
<h2>Label file with brain regions</h2>
nifti label file: <input name="nii_label" type="file" value="">
<br/>label_index-to-acronym file: <input name="index2acr" type="file" value="">
<br/>acronym-to-parent_acronym file (optional): <input name="acr2parent" type="file" value="">
<br/>acronym-to-full_name file (optional): <input name="parent2full" type="file" value="">
<h2>Supporting image modalities (optional)</h2>
nifti image modality 1 (optional): <input name="nii_modality1" type="file" value="">
<br/>nifti image modality 2 (optional): <input name="nii_modality2" type="file" value="">
<br/>nifti image modality 3 (optional): <input name="nii_modality3" type="file" value="">
<br/>nifti image modality 4 (optional): <input name="nii_modality4" type="file" value="">
<br/>nifti image modality 5 (optional): <input name="nii_modality5" type="file" value="">
<br/>nifti image modality 6 (optional): <input name="nii_modality6" type="file" value="">
<br/>nifti image modality 7 (optional): <input name="nii_modality7" type="file" value="">
<br/>nifti image modality 8 (optional): <input name="nii_modality8" type="file" value="">
<input type="submit" value="create template">
</form>
<?php
echo implode(',',array_keys($_GET));
?>
</html>
