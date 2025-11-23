<?php
/**
 * TOTP Helper Functions for 2FA
 * Implements RFC 6238 (TOTP)
 * Based on StickeeBoard implementation
 */

/**
 * Generate a random base32-encoded secret
 */
function generate2FASecret($length = 16) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
    $secret = '';
    for ($i = 0; $i < $length; $i++) {
        $secret .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $secret;
}

/**
 * Decode base32 string to binary
 */
function base32Decode($input) {
    $input = strtoupper($input);
    $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $binary = '';
    for ($i = 0; $i < strlen($input); $i++) {
        $char = $input[$i];
        $value = strpos($map, $char);
        if ($value === false) continue;
        $binary .= str_pad(decbin($value), 5, '0', STR_PAD_LEFT);
    }
    // Convert binary string to bytes
    $bytes = '';
    for ($i = 0; $i < strlen($binary); $i += 8) {
        $byte = substr($binary, $i, 8);
        if (strlen($byte) === 8) {
            $bytes .= chr(bindec($byte));
        }
    }
    return $bytes;
}

/**
 * Generate TOTP code from secret
 * @param string $secret Base32-encoded secret
 * @param int $timeStep Time step in seconds (default 30)
 * @param int $timeOffset Offset in time steps (0 = current, -1 = previous, 1 = next)
 */
function generateTOTP($secret, $timeStep = 30, $timeOffset = 0) {
    $key = base32Decode($secret);
    $time = floor(time() / $timeStep) + $timeOffset;
    
    // Convert time to 8-byte binary string (big-endian)
    $timeBytes = '';
    for ($i = 7; $i >= 0; $i--) {
        $timeBytes .= chr(($time >> ($i * 8)) & 0xFF);
    }
    
    // HMAC-SHA1
    $hmac = hash_hmac('sha1', $timeBytes, $key, true);
    
    // Dynamic truncation
    $offset = ord($hmac[19]) & 0x0F;
    $code = (
        ((ord($hmac[$offset]) & 0x7F) << 24) |
        ((ord($hmac[$offset + 1]) & 0xFF) << 16) |
        ((ord($hmac[$offset + 2]) & 0xFF) << 8) |
        (ord($hmac[$offset + 3]) & 0xFF)
    ) % 1000000;
    
    return str_pad($code, 6, '0', STR_PAD_LEFT);
}

/**
 * Verify TOTP code with time window tolerance
 */
function verifyTOTP($secret, $code, $window = 1) {
    $code = trim($code);
    if (strlen($code) !== 6 || !ctype_digit($code)) {
        return false;
    }
    
    // Check current time step and surrounding windows
    for ($i = -$window; $i <= $window; $i++) {
        $timeStep = 30;
        $key = base32Decode($secret);
        $time = floor(time() / $timeStep) + $i;
        
        $timeBytes = '';
        for ($j = 7; $j >= 0; $j--) {
            $timeBytes .= chr(($time >> ($j * 8)) & 0xFF);
        }
        
        $hmac = hash_hmac('sha1', $timeBytes, $key, true);
        $offset = ord($hmac[19]) & 0x0F;
        $calculated = (
            ((ord($hmac[$offset]) & 0x7F) << 24) |
            ((ord($hmac[$offset + 1]) & 0xFF) << 16) |
            ((ord($hmac[$offset + 2]) & 0xFF) << 8) |
            (ord($hmac[$offset + 3]) & 0xFF)
        ) % 1000000;
        
        $calculated = str_pad($calculated, 6, '0', STR_PAD_LEFT);
        
        if (hash_equals($calculated, $code)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Generate backup codes
 */
function generateBackupCodes($count = 10) {
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        $code = '';
        for ($j = 0; $j < 8; $j++) {
            $code .= sprintf('%04d', random_int(0, 9999));
            if ($j < 7) $code .= '-';
        }
        $codes[] = $code;
    }
    return $codes;
}

/**
 * Verify backup code and remove it if valid
 */
function verifyBackupCode($codesJson, $code) {
    $codes = json_decode($codesJson, true);
    if (!is_array($codes)) {
        return ['valid' => false];
    }
    
    $code = str_replace('-', '', $code);
    foreach ($codes as $index => $storedCode) {
        $storedCode = str_replace('-', '', $storedCode);
        if (hash_equals($storedCode, $code)) {
            // Remove used code
            unset($codes[$index]);
            return [
                'valid' => true,
                'remaining' => array_values($codes) // Re-index array
            ];
        }
    }
    
    return ['valid' => false];
}

?>

