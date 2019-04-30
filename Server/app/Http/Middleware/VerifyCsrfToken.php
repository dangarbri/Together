<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        //
        "/device",
        "/message",
        "/login",
        "/pair",
        "/message/typing",
        "/message/typing/done",
        "/message/read",
        "/lists"
    ];
}