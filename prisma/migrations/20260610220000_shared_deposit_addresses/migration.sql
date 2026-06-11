-- Allow multiple users to share the same platform deposit address (custom wallet mode)
DROP INDEX IF EXISTS "User_depositAddress_key";
DROP INDEX IF EXISTS "User_tronDepositAddress_key";
