<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['message'];

    function user() {
        return $this->belongsTo('App\User', 'to', 'id');
    }
}
