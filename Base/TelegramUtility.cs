using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using monster_world.Models;

namespace monster_world.Base
{
    public static class TelegramUtility
    {
        private static string botToken = System.Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN") 
            ?? "8639079710:AAGUB60SVyqMzIYxOR6LrwNkRYSYMYSgmuA";
        public static bool VerifyTelegramInitData(string initData, out long userId, out TelegramUser user, out string startParam)
        {
            userId = 0;
            user = null;
            startParam = "";

            var parsed = System.Web.HttpUtility.ParseQueryString(initData);

            var hash = parsed["hash"];
            parsed.Remove("hash");

            Console.WriteLine(hash);

            var dataCheckArr = parsed.AllKeys
                .OrderBy(k => k)
                .Select(k => $"{k}={parsed[k]}");

            var dataCheckString = string.Join("\n", dataCheckArr);

            using var sha256 = SHA256.Create();
            using var hmacKey = new HMACSHA256(Encoding.UTF8.GetBytes("WebAppData"));
            var secretKey = hmacKey.ComputeHash(Encoding.UTF8.GetBytes(botToken));
            
            using var hmac = new HMACSHA256(secretKey);
            var computedHash = BitConverter
                .ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(dataCheckString)))
                .Replace("-", "")
                .ToLower();

            if (computedHash != hash)
            {
                Console.WriteLine($"Computed: {computedHash} and Hash: {hash}");
                Console.WriteLine("Hash didn't matched");
                return false;
            }

            // Check auth_date
            var authDate = long.Parse(parsed["auth_date"]);
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            if (now - authDate > 3600)
                return false;

            // Extract user id
            var userJson = parsed["user"];
            var userDoc = JsonDocument.Parse(userJson);
            user = JsonSerializer.Deserialize<TelegramUser>(userJson);
            userId = userDoc.RootElement.GetProperty("id").GetInt64();
            startParam = parsed["start_param"] ?? "";

            return true;
        }
    }
}