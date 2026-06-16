using System.IO.Compression;
using System.Text;
using System;
using System.Security.Cryptography;
using Telegram.Bot.Types.Enums;
namespace monster_world.Extentions
{
    public static class Extentions
    {
        public static string ToJson(this object obj)
        {
            var options = new System.Text.Json.JsonSerializerOptions
            {
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
            };
            return System.Text.Json.JsonSerializer.Serialize(obj, options);
        }
        public static string GZIP(this string input)
        {
            if (string.IsNullOrEmpty(input)) return input;

            byte[] inputBytes = Encoding.UTF8.GetBytes(input);

            using (var outputStream = new MemoryStream())
            {
                using (var gzipStream = new GZipStream(outputStream, CompressionMode.Compress))
                {
                    gzipStream.Write(inputBytes, 0, inputBytes.Length);
                }

                return Convert.ToBase64String(outputStream.ToArray());
            }
        }

        public static string RandomHex(int byteLength = 16) 
        {
            byte[] bytes = new byte[byteLength];
            RandomNumberGenerator.Fill(bytes);

            return "0x" + BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }

        public static int RandomBetween(string value, string sep)
        {
            // sep = ":" || "-"
            int value1 = int.Parse(value.Split(sep)[0]);
            int value2 = int.Parse(value.Split(sep)[1]);

            Random random = new Random();

            return random.Next(value1, value2 + 1);
        }

        public static double RandomDoubleBetween(string value, string sep)
        {
            // sep = ":" || "-"
            double value1 = double.Parse(value.Split(sep)[0], System.Globalization.CultureInfo.InvariantCulture);
            double value2 = double.Parse(value.Split(sep)[1], System.Globalization.CultureInfo.InvariantCulture);

            Random random = new Random();

            return value1 + (random.NextDouble() * (value2 - value1));
        }



        
    }
}