using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Primitives;
using monster_world.Base;
using monster_world.Models;
using System.Collections.Concurrent;

namespace monster_world.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ValidateRequestAttribute : Attribute, IAsyncActionFilter
    {
        private static readonly ConcurrentDictionary<long, SemaphoreSlim> _userLocks = new();

        public async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next)
        {
            var request = context.HttpContext.Request;

            if (context.ActionDescriptor.EndpointMetadata
                .Any(x => x is ValidateRequestIgnore))
            {
                await next();
                return;
            }

            if (!request.Headers.TryGetValue("InitData", out StringValues initData))
            {
                Console.WriteLine("No init found");

                context.Result = new ContentResult
                {
                    StatusCode = StatusCodes.Status409Conflict
                };

                return;
            }

            string init = initData.ToString();

            Console.WriteLine(init);

            bool verify = TelegramUtility.VerifyTelegramInitData(
                init,
                out long UID,
                out TelegramUser user);

            if (!verify)
            {
                Console.WriteLine("Verification Failed");

                context.Result = new ContentResult
                {
                    StatusCode = StatusCodes.Status401Unauthorized
                };

                return;
            }

            context.HttpContext.Items["ID"] = UID;
            context.HttpContext.Items["User"] = user;

            var userLock = _userLocks.GetOrAdd(
                UID,
                _ => new SemaphoreSlim(1, 1));

            bool acquired = false;

            try
            {
                acquired = await userLock.WaitAsync(
                    TimeSpan.FromSeconds(30));

                if (!acquired)
                {
                    context.Result = new ContentResult
                    {
                        StatusCode = StatusCodes.Status429TooManyRequests,
                        Content = "Request already in progress."
                    };

                    return;
                }

                await next();
            }
            finally
            {
                if (acquired)
                    userLock.Release();
            }
        }
    }
}