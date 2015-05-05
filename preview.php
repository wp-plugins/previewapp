<?php
/*
Plugin Name: PreviewApp
Plugin URI: http://www.preview-app.net
Description: Plugin d'installation de preview sur votre site wordpress
Version: 0.4
Author: Preview
Author URI: http://www.preview-app.net
License: GPL2
*/

// Make sure we don't expose any info if called directly
if ( !function_exists( 'add_action' ) ) {
	echo 'Hi there!  I\'m just a plugin, not much I can do when called directly.';
	exit;
}

define( 'PREVIEWAPP_VERSION', '4.0.3' );
define( 'PREVIEWAPP__MINIMUM_WP_VERSION', '3.1' );

// modification des headers pour les mettre en SameOrigin quand preview est activ
@header('X-FRAME-OPTIONS: ALLOW-FROM https://projets.preview-app.net');
@header('Access-Control-Allow-Origin: *');

add_action('wp_enqueue_scripts', function () {
	wp_register_script('PreViewApp', 'http://projets.preview-app.net/injection.js');
});