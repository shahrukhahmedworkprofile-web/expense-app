<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function __construct(
        private TokenService $tokenService
    ) {
    }

    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $accessToken = $this->tokenService
            ->createAccessToken($user);

        $refreshToken = $this->tokenService
            ->createRefreshToken($user);

        return response()
            ->json([
                'message' => 'Registration successful.',
                'user' => $user,
            ], 201)
            ->withCookie($this->accessTokenCookie($accessToken))
            ->withCookie($this->refreshTokenCookie($refreshToken));
    }

    /**
     * Login.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        // Remove existing active tokens from previous sessions.
        $this->tokenService->revokeAllTokens($user);

        $accessToken = $this->tokenService
            ->createAccessToken($user);

        $refreshToken = $this->tokenService
            ->createRefreshToken($user);

        return response()
            ->json([
                'message' => 'Login successful.',
                'user' => $user,
            ])
            ->withCookie($this->accessTokenCookie($accessToken))
            ->withCookie($this->refreshTokenCookie($refreshToken));
    }

    /**
     * Return authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Refresh access token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return response()->json([
                'message' => 'Refresh token is missing.',
            ], 401);
        }

        $storedToken = $this->tokenService
            ->findValidRefreshToken($refreshToken);

        if (!$storedToken) {
            return response()->json([
                'message' => 'Refresh token is invalid or expired.',
            ], 401);
        }

        $user = $storedToken->user;

        // Rotate the refresh token.
        $this->tokenService
            ->revokeRefreshToken($storedToken);

        // Revoke old access tokens.
        $user->accessTokens()
            ->whereNull('revoked_at')
            ->update([
                'revoked_at' => now(),
            ]);

        $accessToken = $this->tokenService
            ->createAccessToken($user);

        $newRefreshToken = $this->tokenService
            ->createRefreshToken($user);

        return response()
            ->json([
                'message' => 'Token refreshed successfully.',
            ])
            ->withCookie($this->accessTokenCookie($accessToken))
            ->withCookie($this->refreshTokenCookie($newRefreshToken));
    }

    /**
     * Logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $accessToken = $request->cookie('access_token');

        if ($accessToken) {
            $storedToken = $this->tokenService
                ->findValidAccessToken($accessToken);

            if ($storedToken) {
                $this->tokenService
                    ->revokeAccessToken($storedToken);
            }
        }

        $refreshToken = $request->cookie('refresh_token');

        if ($refreshToken) {
            $storedRefreshToken = $this->tokenService
                ->findValidRefreshToken($refreshToken);

            if ($storedRefreshToken) {
                $this->tokenService
                    ->revokeRefreshToken($storedRefreshToken);
            }
        }

        return response()
            ->json([
                'message' => 'Logout successful.',
            ])
            ->withCookie(cookie()->forget('access_token'))
            ->withCookie(cookie()->forget('refresh_token'));
    }

    /**
     * Access token cookie.
     */
    private function accessTokenCookie(string $token)
    {
        return cookie(
            'access_token',
            $token,
            15,
            '/',
            null,
            false,
            true,
            false,
            'lax'
        );
    }

    /**
     * Refresh token cookie.
     */
    private function refreshTokenCookie(string $token)
    {
        return cookie(
            'refresh_token',
            $token,
            60 * 24 * 30,
            '/',
            null,
            false,
            true,
            false,
            'lax'
        );
    }
}