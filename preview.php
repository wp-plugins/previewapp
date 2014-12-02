<?php
/*
Plugin Name: PreviewApp
Plugin URI: http://www.preview-app.net
Description: Plugin d'installation de preview sur votre site wordpress
Version: 0.1
Author: Preview
Author URI: http://www.preview-app.net
License: GPL2
*/

// Make sure we don't expose any info if called directly
if ( !function_exists( 'add_action' ) ) {
	echo 'Hi there!  I\'m just a plugin, not much I can do when called directly.';
	exit;
}

define( 'PREVIEWAPP_VERSION', '4.0.2' );
define( 'PREVIEWAPP__MINIMUM_WP_VERSION', '3.1' );
define( 'PREVIEWAPP__PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'PREVIEWAPP__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'PREVIEWAPP_DELETE_LIMIT', 100000 );
define( 'PREVIEWAPP__JS', "injection.js" );

// modification des headers pour les mettre en SameOrigin quand preview est activé.
@header("X-FRAME-OPTIONS:  SAMEORIGIN");//ALLOW-FROM https://projets.preview-app.net"); 
@header("Access-Control-Allow-Origin: *");

if(is_file(PREVIEWAPP__PLUGIN_DIR.PREVIEWAPP__JS))
{
// add preview-app javascript
wp_enqueue_script('PreViewApp');
wp_register_script('PreViewApp', PREVIEWAPP__PLUGIN_URL.PREVIEWAPP__JS);
wp_enqueue_script('PreViewApp');
}
else
{
	echo 'Error: The Javascript File is empty. See http://www.preview-app.net';
	exit;
}
