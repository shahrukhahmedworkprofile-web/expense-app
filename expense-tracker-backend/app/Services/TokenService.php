<?php

namespace App\Services;

use App\Models\AccessToken;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Str;

class TokenService
{
    private int $accessTokenLifetime = 15;

    private int $refreshTokenLifetime = 30;

    /**
     * Create an access token and store only its hash.
     */
    public function createAccessToken(User $user): string
    {
        $token = Str::random(80);

        AccessToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addMinutes($this->accessTokenLifetime),
        ]);

        return $token;
    }

    /**
     * Create a refresh token and store only its hash.
     */
    public function createRefreshToken(User $user): string
    {
        $token = Str::random(100);

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays($this->refreshTokenLifetime),
        ]);

        return $token;
    }

    /**
     * Find a valid access token.
     */
    public function findValidAccessToken(string $token): ?AccessToken
    {
        return AccessToken::where(
            'token_hash',
            hash('sha256', $token)
        )
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Find a valid refresh token.
     */
    public function findValidRefreshToken(string $token): ?RefreshToken
    {
        return RefreshToken::where(
            'token_hash',
            hash('sha256', $token)
        )
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Revoke an access token.
     */
    public function revokeAccessToken(AccessToken $accessToken): void
    {
        $accessToken->update([
            'revoked_at' => now(),
        ]);
    }

    /**
     * Revoke a refresh token.
     */
    public function revokeRefreshToken(RefreshToken $refreshToken): void
    {
        $refreshToken->update([
            'revoked_at' => now(),
        ]);
    }

    /**
     * Revoke all tokens belonging to a user.
     */
    public function revokeAllTokens(User $user): void
    {
        $user->accessTokens()
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        $user->refreshTokens()
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }
}