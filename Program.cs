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


string connectionString = System.Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? "Host=localhost;Port=5432;Database=monsterworlddb;Username=hritik;Password=weewee";

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
    ?? "8758601978:AAEL44gqPqNQey3CLpyaElRvR3PnVcWbEMI";

builder.Services.AddSingleton<ITelegramBotClient>( sp => {
        return new TelegramBotClient(botToken);
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

    // Seed Daily, Weekly, and Achievement Missions if they don't exist
    var missionsToSeed = gameplay.MissionsToSeed;

    foreach (var mission in missionsToSeed)
    {
        if (!await db.AvailableMissions.AnyAsync(x => x.MissionId == mission.MissionId))
        {
            db.AvailableMissions.Add(mission);
        }
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
