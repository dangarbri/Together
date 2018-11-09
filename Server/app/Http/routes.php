<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

// Route::get('/', "ApiController@GetMessages");

Route::group(['middleware' => ['api']], function () {
    Route::get( '/message', "ApiController@GetMessages");
    Route::post('/message', "ApiController@PostMessage");
    Route::post('/message/typing', "ApiController@PostTyping");
    Route::post('/message/typing/done', "ApiController@PostTypingDone");
    Route::post('/message/read', "ApiController@PostMarkRead");
    Route::post('/device', "ApiController@PostRegisterDevice");
    Route::get( '/device', "ApiController@GetRegisterDevice");
    Route::get( '/pair', "ApiController@GetPairingCode");
    Route::post('/pair', "ApiController@PostPairingCode");
    Route::get( '/lists', "ApiController@GetLists");
    Route::post('/lists', "ApiController@PostLists");
    Route::get('/apk', "ApiController@GetApk");
});
Route::auth();

Route::get('/home', 'HomeController@index');
