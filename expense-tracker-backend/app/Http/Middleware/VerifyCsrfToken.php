<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class VerifyCsrfToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            return $next($request);
        }

        $cookieToken = $request->cookie('csrf_token');
        $headerToken = $request->header('X-CSRF-TOKEN');

        if (!$cookieToken || !$headerToken || !hash_equals($cookieToken, $headerToken)) {
            return response()->json([
                'message' => 'CSRF token mismatch.',
            ], 419);
        }

        return $next($request);
    }
}