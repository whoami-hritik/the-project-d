using Microsoft.EntityFrameworkCore;
using monster_world.Services;
using Telegram.Bot;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);


builder.Services.AddDbContext<monster_world.DBContext.AppDbContext>(options =>
    options.UseNpgsql(
        "Host=localhost;Port=5432;Database=monsterworlddb;Username=hritik;Password=weewee"
    ));

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

builder.Services.AddSingleton<ITelegramBotClient>( sp => {
        return new TelegramBotClient("8758601978:AAEL44gqPqNQey3CLpyaElRvR3PnVcWbEMI");
});

builder.Services.AddScoped<UserService>();

var monsters = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.List<monster_world.Models.MonsterDef>>(System.IO.File.ReadAllText("wwwroot/data/monsters.json"));
var skills = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.List<monster_world.Models.SkillDef>>(System.IO.File.ReadAllText("wwwroot/data/skills.json"));
var gameplay = System.Text.Json.JsonSerializer.Deserialize<monster_world.Models.GameplayConfig>(System.IO.File.ReadAllText("wwwroot/data/gameplay.json"));

builder.Services.AddSingleton(new monster_world.Services.GameplayService(monsters, skills, gameplay));
builder.Services.AddScoped<monster_world.Services.BattleService>();
builder.Services.AddSingleton<PoolService>();

builder.Services.AddScoped<TGBOT.TelegramBot>();

var app = builder.Build();
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
