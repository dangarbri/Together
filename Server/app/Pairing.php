<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Pairing extends Model
{
    protected $hidden = ['id', 'created_at', 'updated_at', 'user_id'];
    function user() {
        return $this->belongsTo('App\User');
    }
}
