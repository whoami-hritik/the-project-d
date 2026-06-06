using System.Text;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace monster_world.Controller
{  
    public class EnhanceController : ControllerBase
    {
        public async Task<string> GetBody()
        {
            Stream streamBody = Request.Body;
            
            using(StreamReader reader = new StreamReader(streamBody))
            {
                var reqBody = await reader.ReadToEndAsync();
                return reqBody;
            }
        }
        public async Task<T> GetForm<T>(T form)
        {
            string body = await GetBody();
            return JsonConvert.DeserializeAnonymousType(body, form);

        }
    }
}