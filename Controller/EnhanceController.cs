using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.AspNetCore.Http;

namespace monster_world.Controller
{  
    public class EnhanceController : ControllerBase
    {
        [NonAction]
        public async Task<string> GetBody()
        {
            Stream streamBody = Request.Body;
            
            using(StreamReader reader = new StreamReader(streamBody))
            {
                var reqBody = await reader.ReadToEndAsync();
                return reqBody;
            }
        }

        [NonAction]
        public async Task<T> GetForm<T>(T form)
        {
            string body = await GetBody();
            if (string.IsNullOrEmpty(body))
            {
                return form;
            }

            try
            {
                JToken token = JToken.Parse(body);
                SanitizeToken(token);
                string sanitizedBody = token.ToString();
                return JsonConvert.DeserializeAnonymousType(sanitizedBody, form);
            }
            catch (JsonReaderException ex)
            {
                throw new BadHttpRequestException("Invalid JSON format in request body.", ex);
            }
        }

        private void SanitizeToken(JToken token)
        {
            if (token == null) return;

            if (token is JObject obj)
            {
                foreach (var property in obj.Properties())
                {
                    SanitizeToken(property.Value);
                }
            }
            else if (token is JArray arr)
            {
                for (int i = 0; i < arr.Count; i++)
                {
                    SanitizeToken(arr[i]);
                }
            }
            else if (token is JValue val)
            {
                if (val.Value is double d && (double.IsNaN(d) || double.IsInfinity(d)))
                {
                    val.Value = 0.0;
                }
                else if (val.Value is float f && (float.IsNaN(f) || float.IsInfinity(f)))
                {
                    val.Value = 0.0f;
                }
                else if (val.Type == JTokenType.String)
                {
                    string strVal = val.Value?.ToString();
                    if (strVal != null && (strVal.Equals("NaN", StringComparison.OrdinalIgnoreCase) || 
                                           strVal.Contains("Infinity", StringComparison.OrdinalIgnoreCase)))
                    {
                        val.Value = "0";
                    }
                }
            }
        }
    }
}