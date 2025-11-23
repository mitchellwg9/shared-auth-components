# Password Security - Password Hashing

## What is `password_hash`?

`password_hash` refers to using PHP's `password_hash()` function to securely store passwords. Instead of storing passwords in plain text (which is a major security risk), passwords are converted into a one-way hash that cannot be reversed.

### How it works:

1. **Registration**: When a user creates an account, their password is hashed using `password_hash($password, PASSWORD_DEFAULT)`
   - This creates a bcrypt hash (or argon2 on newer PHP versions)
   - The hash includes a random salt, so the same password produces different hashes
   - Example hash: `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`

2. **Login**: When a user logs in, their entered password is verified using `password_verify($enteredPassword, $storedHash)`
   - This compares the entered password against the stored hash
   - Returns `true` if they match, `false` otherwise

### Database Column Name

The database column can be named either:
- `password` (what we're currently using)
- `password_hash` (alternative name)

**The column name doesn't matter** - what matters is that the **value** stored in that column is a hash created by `password_hash()`, not the plain text password.

### Current Implementation

✅ **Registration**: Passwords are now hashed using `password_hash()` before storing in the database

✅ **Login**: Passwords are verified using `password_verify()` against the stored hash

✅ **Migration**: The code automatically migrates any existing plain text passwords to hashed passwords when users log in

### Security Benefits

- **One-way encryption**: Even if someone gains access to your database, they cannot see the actual passwords
- **Salt included**: Each password hash includes a unique salt, preventing rainbow table attacks
- **Industry standard**: Uses PHP's built-in functions which are battle-tested and secure

### Example

```php
// Registration
$plainPassword = "mySecretPassword123";
$hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
// Stores: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

// Login
$enteredPassword = "mySecretPassword123";
$storedHash = "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";
if (password_verify($enteredPassword, $storedHash)) {
    // Password is correct!
}
```

