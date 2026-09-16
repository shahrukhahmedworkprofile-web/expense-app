<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\TokenService;
use Closure;

class AuthenticateWithAccessToken
{
    public function __construct(
        private TokenService $tokenService
    ) {
    }

    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $token = $request->cookie('access_token');

        if (!$token) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $accessToken = $this->tokenService
            ->findValidAccessToken($token);

        if (!$accessToken) {
            return response()->json([
                'message' => 'Access token is invalid or expired.',
            ], 401);
        }

        // Authenticate the user for this request.
        $request->setUserResolver(
            fn () => $accessToken->user
        );

        return $next($request);
    }
}