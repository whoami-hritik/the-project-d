using Microsoft.EntityFrameworkCore;
using monster_world.DBContext;
using monster_world.Models;
using monster_world.Services;
using Telegram.Bot;

// Load environment variables from .env file
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);


string? connectionString = System.Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string is not configured. Please define DB_CONNECTION_STRING in your environment or .env file.");
}

builder.Services.AddDbContext<monster_world.DBContext.AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

string botToken = System.Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")
    ?? "8859812843:AAEqhO8R6Q41uK3Qy8lJcQ_k3eS12j4T7pE";

builder.Services.AddSingleton<ITelegramBotClient>( sp => {
    var handler = new System.Net.Http.SocketsHttpHandler
    {
        ConnectCallback = async (context, cancellationToken) =>
        {
            var ips = await System.Net.Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, cancellationToken);
            System.Net.IPAddress ipv4 = null;
            foreach (var ip in ips)
            {
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    ipv4 = ip;
                    break;
                }
            }
            if (ipv4 == null)
            {
                throw new System.Net.Sockets.SocketException((int)System.Net.Sockets.SocketError.HostNotFound);
            }
            var socket = new System.Net.Sockets.Socket(System.Net.Sockets.SocketType.Stream, System.Net.Sockets.ProtocolType.Tcp);
            try
            {
                await socket.ConnectAsync(new System.Net.IPEndPoint(ipv4, context.DnsEndPoint.Port), cancellationToken);
                return new System.Net.Sockets.NetworkStream(socket, ownsSocket: true);
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }
    };
    var httpClient = new System.Net.Http.HttpClient(handler) { Timeout = TimeSpan.FromSeconds(30) };
    return new TelegramBotClient(botToken, httpClient);
});

builder.Services.AddScoped<UserService>();

var monsters = System.Text.Json.JsonSerializer.Deserialize<monster_world.Models.MonsterDefination>(System.IO.File.ReadAllText("Gameplay/monsters.json"));
var skills = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.List<monster_world.Models.SkillDef>>(System.IO.File.ReadAllText("Gameplay/skills.json"));
var gameplay = System.Text.Json.JsonSerializer.Deserialize<monster_world.Models.GameConfig>(System.IO.File.ReadAllText("Gameplay/gameplay.json"));

builder.Services.AddSingleton(gameplay);
builder.Services.AddSingleton(new monster_world.Services.GameplayService(monsters, skills, gameplay));
builder.Services.AddScoped<monster_world.Services.BattleService>();
builder.Services.AddScoped<monster_world.Services.MapService>();
builder.Services.AddSingleton<PoolService>();

builder.Services.AddScoped<TGBOT.TelegramBot>();

var app = builder.Build();



using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    // Repair null ListingType entries in Marketplace
    var unclassifiedListings = await db.Marketplace.Where(x => x.ListingType == null || x.ListingType == "").ToListAsync();
    foreach (var listing in unclassifiedListings)
    {
        listing.ListingType = "monster";
    }

    foreach (var map in gameplay.Maps)
    {
        if (!await db.MapLiquidity.AnyAsync(x => x.MapId == map.Map))
        {
            MapBase MapLiquidity = new()
            {
                MapId = map.Map,
                MapLiquidity = 0,
                DailyUSDTLiquidity = 0,
                TotalUsers = 0
            };
            db.MapLiquidity.Add(MapLiquidity);
        }
    }

    // Seed and Synchronize Daily, Weekly, and Achievement Missions
    var missionsToSeed = gameplay.MissionsToSeed;
    var seedIds = missionsToSeed.Select(m => m.MissionId).ToList();

    // 1. Update existing missions or insert new ones
    foreach (var mission in missionsToSeed)
    {
        var existingMission = await db.AvailableMissions.FirstOrDefaultAsync(x => x.MissionId == mission.MissionId);
        if (existingMission == null)
        {
            db.AvailableMissions.Add(mission);
        }
        else
        {
            existingMission.Title = mission.Title;
            existingMission.Description = mission.Description;
            existingMission.RewardAmount = mission.RewardAmount;
            existingMission.RewardCurrency = mission.RewardCurrency;
            existingMission.VerificationType = mission.VerificationType;
            existingMission.VerificationUrl = mission.VerificationUrl;
            existingMission.Category = mission.Category;
            existingMission.IsActive = true; // Ensure it's active if present in JSON
        }
    }

    // 2. Deactivate missions that are no longer present in gameplay.json
    var missionsToDeactivate = await db.AvailableMissions
        .Where(x => x.IsActive && !seedIds.Contains(x.MissionId))
        .ToListAsync();

    foreach (var oldMission in missionsToDeactivate)
    {
        oldMission.IsActive = false;
    }

    await db.SaveChangesAsync();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
   
    app.UseHsts();
}


// app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");

app.MapControllers();





app.MapRazorPages();

app.Run();
