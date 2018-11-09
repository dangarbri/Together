<?php

namespace App;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'email', 'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    function pairing() {
        return $this->hasOne('App\Pairing');
    }

    function messages() {
        return $this->hasMany('App\Message', 'to');
    }

    function peer() {
        return $this->hasOne('App\User', 'id', 'partner');
    }
}
