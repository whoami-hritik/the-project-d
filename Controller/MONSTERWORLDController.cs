using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using monster_world.Filters;
using monster_world.Models;
using monster_world.DBContext;
using Microsoft.EntityFrameworkCore;
using Telegram.Bot.Types;
using monster_world.Services;
using Telegram.Bot.Types.Payments;
using monster_world.Models.Dto;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Diagnostics.Eventing.Reader;
using Microsoft.VisualBasic;
using Newtonsoft.Json;
using Microsoft.Extensions.Options;



namespace monster_world.Controller
{
    [ValidateRequest]
    [ApiController]
    [Route("[controller]")]
    public class MonsterWorld : EnhanceController
    {

        
                
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly BattleService _battleService;
        private readonly GameplayService _gameplayService;
        private readonly TGBOT.TelegramBot _tgbot;
        private readonly PoolService _poolService;
        private static readonly HttpClient _httpClient = new HttpClient();

        public MonsterWorld(
            AppDbContext context, 
            TGBOT.TelegramBot tgbot, 
            UserService userService, 
            BattleService battleService,
            GameplayService gameplayService,
            PoolService poolService)
        {
            _context = context;
            _tgbot = tgbot;
            _userService = userService; 
            _battleService = battleService; 
            _gameplayService = gameplayService;      
            _poolService = poolService;
        }        
        
        [ValidateRequestIgnore]
        [HttpPost("telegram/update")]
        public async Task<IActionResult> TGUpdate([FromBody]Update update)
        {
            
            if (update.Message!= null)
            {
                await _tgbot.OnMessage(update);
            }
            return Ok();
        }

        [ValidateRequestIgnore]
        [HttpPost("blockchain/update")]
        public async Task<IActionResult> BlockchainUpdate([FromBody] TonWebhookPayload update)
        {

            Console.WriteLine("Blockchain Update!");
            if (update.AccountId != "0:a743e47bece2f279cf84ffa90c8204ac06116a2cbb45a613b9adc3c35111fc26")
                return Ok();


            var url = $"https://tonapi.io/v2/blockchain/transactions/{update.TxHash}";

            var response = await _httpClient.GetAsync(url);

            var json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode || !json.TrimStart().StartsWith('{'))
                return Ok();

            var tx = JsonConvert.DeserializeObject<TonTransaction>(json);

            if (!tx.Success) return Ok();
            
            if (await _context.Deposits.FirstOrDefaultAsync(x => x.Hash == update.TxHash) != null)
                return Ok();

            var outMsg = tx?.OutMsgs?.FirstOrDefault();

            string comment = outMsg?.DecodedBody?.Text ?? tx?.InMsg?.DecodedBody?.Text;
            long valueNano = outMsg?.Value > 0 ? outMsg.Value : (tx?.InMsg?.Value ?? 0);
            double tonAmount = valueNano / 1_000_000_000.0;
            if (string.IsNullOrEmpty(comment) || !long.TryParse(comment, out long userId))
                return Ok();

            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.ID == userId);
            UserAnalytics analytics = await _context.Analytics.FirstOrDefaultAsync( x => x.ID == User.ID);

            if (User == null)
                return Ok();

            Console.WriteLine($"Before Credit - User TON: {User.Balance.TON}");
            User.Credit("TON", tonAmount, "deposit=" + update.TxHash);
            Console.WriteLine($"After Credit - User TON: {User.Balance.TON}");

            if (analytics == null)
            {
                analytics = new UserAnalytics { ID = User.ID };
                await _context.Analytics.AddAsync(analytics);
            }

            // Balance is now replaced as a whole, EF Core detects the change automatically
            _context.Users.Update(User);

            Deposit deposit = new()
            {
                UserID = User.ID,
                Amount = tonAmount,
                Balance = new Balance { TON = User.Balance.TON, GOLD = User.Balance.GOLD, CRYSTAL = User.Balance.CRYSTAL },
                Successful = true,
                Completed = true,
                Hash = update.TxHash,
                Time = DateTimeOffset.FromUnixTimeSeconds(tx.Utime).UtcDateTime,
                SuccessfulAt = DateTime.UtcNow
            };
            
            double USDTConversion = await GetTonPrice() * tonAmount;
            analytics.TotalDeposit += USDTConversion;

            await _context.Deposits.AddAsync(deposit);
            try
            {
                Console.WriteLine($"Saving changes - User ID: {User.ID}, TON Balance to save: {User.Balance.TON}");
                int changesCount = await _context.SaveChangesAsync();
                Console.WriteLine($"SaveChangesAsync returned: {changesCount} rows affected");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving deposit/credit: {ex.Message}\n{ex.InnerException}\n{ex.StackTrace}");
                await _tgbot.NotifyAdmin($"Error saving deposit: {ex.Message}");
                return Ok();
            }

            string AdminMsg = $"Deposit Done!\n\n ID: {User.ID}\nDeposit Amt: {tonAmount:F2}\nHash: {update.TxHash}\nTON Bal: {User.Balance.TON}\nGOLD Bal: {User.Balance.GOLD}\nCRYSTAL Bal: {User.Balance.CRYSTAL}\nRegistered At: {User.RegistrationDate}";
            await _tgbot.Notify(User.ID, $"Deposit confirmed! {tonAmount:F2} TON added to your balance.");
            await _tgbot.NotifyAdmin(AdminMsg);
            return Ok();

        }

        [HttpPost("user")]
        public async Task<IActionResult> GetOrCreateUser()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);
            return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User) });
        }

        [HttpGet("deposit")]
        public async Task<IActionResult> Deposit()
        {
            string DepositAddress = "abc"; //main wallet address
            return Ok(new{ success = true, DepositAddress});
        }
        [HttpPost("bonus/receive")]
        public async Task<IActionResult> GetBonus()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            var form = await GetForm(new { index = 0 });
            if (form.index < 0 || form.index >= SignUpBonus.Monsters.Count)
            {
                return BadRequest(new { success = false });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);

            if (User.Bonus) return Ok(new { success = false, reason = "bonus already received"});
            var monsterId = SignUpBonus.Monsters[form.index];

            Monster monster = _gameplayService.CreateMonsterInstance(monsterId, User.ID, 1);
            monster.Log(monster.InstanceId, monster.Level, "signupbonus=" + User.ID);

            await _context.Monsters.AddAsync(monster);

            User.Monsters.Add(monster.InstanceId);
            User.Bonus = true;

            User.Credit("CRYSTAL", SignUpBonus.CRYSTAL, "signupbonus=" + monster.InstanceId);
            User.Credit("GOLD", SignUpBonus.GOLD, "signupbonus=" + monster.InstanceId);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User), Monster = monster });
        }

        [HttpPost("world/spawn")]
        public async Task<IActionResult> SpawnMonsterLocation()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);
            var form = await GetForm(new { world = "" });

            if (!User.UnlockedWorlds.Contains(form.world))
            {
                return Ok(new { success = false, reason = "world locked" });
            }

            var spawns = await _context.Spawns.FirstOrDefaultAsync(x => x.UserId == User.ID);
            if (spawns == null)
            {
                spawns = new WorldSpawns
                {
                    UserId = User.ID,
                    Spawns = new List<Models.Location>()
                };
                await _context.Spawns.AddAsync(spawns);
            }

            var locations = spawns.Spawns.FirstOrDefault(x => x.World == form.world);
            if (locations == null)
            {
                locations = new Models.Location
                {
                    World = form.world,
                    Nodes = _gameplayService.RandomLocations(form.world),
                    LastSpawned = DateTime.UtcNow
                };
                spawns.Spawns.Add(locations);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, spawns = locations });
            }

            if (locations.LastSpawned.AddHours(1) <= DateTime.UtcNow)
            {
                locations.Nodes = _gameplayService.RandomLocations(form.world);
                locations.LastSpawned = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, spawns = locations });
        }

        [HttpPost("battle/start")]
        public async Task<IActionResult> FightBattle()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);
            var form = await GetForm(new { World = "", Node = "", AttackerId = "" });

            if (!User.UnlockedWorlds.Contains(form.World))
            {
                return Ok(new { success = false, reason = "world locked" });
            }
            if (!User.Monsters.Contains(form.AttackerId))
            {
                return Ok(new { success = false, reason = "no such monster found" });
            }

            WorldSpawns spawns = await _context.Spawns.FirstOrDefaultAsync(x => x.UserId == User.ID);
            if (spawns == null)
            {
                return BadRequest(new { success = false });
            }

            Models.Location map = spawns.Spawns.FirstOrDefault(x => x.World == form.World);
            if (map == null || map.LastSpawned.AddMinutes(60) < DateTime.UtcNow)
            {
                return Ok(new { success = false, reason = "monster location became older" });
            }

            if (!map.Nodes.Contains(form.Node))
            {
                return Ok(new { success = false, reason = "not an active location" });
            }

            Monster Attacker = _context.Monsters.FirstOrDefault(m => m.InstanceId == form.AttackerId);
            if (Attacker == null || Attacker.OwnerID != User.ID)
            {
                return Ok(new { success = false, reason = "invalid monster hash or not owner" });
            }

            if (Attacker.IsFighting)
            {
                //old battle lookup
                var battle = _context.Battles.FirstOrDefault(b => b.PlayerMonster.InstanceId == Attacker.InstanceId && b.Status == BattleStatus.Active);

                if (battle != null)
                {
                    if (battle.StartedAt.AddMinutes(2) <= DateTime.UtcNow)
                    {
                        battle.Status = BattleStatus.Forfeited;
                        Attacker.IsFighting = false;
                    }
                    else 
                    {
                        return Ok(new { success = false, reason = "monster already in battle" });
                    }
                }
            }

            map.Nodes.Remove(form.Node);
            var NodeMonsters = _gameplayService.GetLocationMonsters(form.World, form.Node);
            if (NodeMonsters == null || !NodeMonsters.Any())
            {
                return BadRequest(new { success = false, reason = "no monsters at location" });
            }

            Random rnd = new Random();
            string selectMonsterId = NodeMonsters[rnd.Next(NodeMonsters.Count)];
            int rndLevel = Math.Max(1, rnd.Next(Attacker.Level - 5, Attacker.Level + 3));

            Monster Enemymonster = _gameplayService.CreateMonsterInstance(selectMonsterId, 0, rndLevel);

            BattleState battleState = new()
            {
                PlayerId = User.ID,
                PlayerMonster = Attacker,
                EnemyMonster = Enemymonster,
                PlayerState = new(),
                EnemyState = new(),
                Status = BattleStatus.Active,
                StartedAt = DateTime.UtcNow,
                TurnCount = 0,
                PlayerActiveSkills = _battleService.GetActiveSkills(Attacker),
                EnemyActiveSkills = _battleService.GetActiveSkills(Enemymonster),
            };

            Attacker.IsFighting = true;
            User.TotalBattles += 1;

            await _context.Battles.AddAsync(battleState);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, battleState });
        }


        [HttpPost("battle/attack")]
        public async Task<IActionResult> Attack()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            HttpContext.Items.TryGetValue("ID", out var id);

            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user); //test user

            var form = await GetForm( new
            {
                BattleId = new Guid(),
                SkillId = ""
            });

            BattleState battleState = await _context.Battles.Include(b => b.PlayerMonster).Include(b => b.EnemyMonster).FirstOrDefaultAsync(b => b.BattleId == form.BattleId);

            if (battleState == null)
                return Ok( new { success = false, reason = "no battle found"});
            
            if (battleState.PlayerId != User.ID)
                return Ok( new { success = false });

            if (battleState.Status != BattleStatus.Active)
                return Ok( new { success = false, reason = "battle already ended"});
            
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = false, reason = "battle is forfeited"});
            }

            if (!battleState.PlayerActiveSkills.Contains(form.SkillId))
                return Ok( new { success = false, reason = "unknown skill"});

            if (battleState.PlayerCooldownSkill == form.SkillId)
                return Ok( new { success = false, reason = "skill cooldown"});


            battleState.TurnCount += 1;
            //player attack on enemy
            MonsterState PlayerState = battleState.PlayerState;
            MonsterState EnemyState = battleState.EnemyState;
            //reset pending heal
            PlayerState.PendingHeal = 0;
            EnemyState.PendingHeal = 0;
            
            AttackResult playerAttack = _battleService.PlayerAttack(ref battleState, form.SkillId, ref PlayerState, ref EnemyState);
            AttackResult enemyAttack = null;

            battleState.PlayerState = PlayerState;
            battleState.EnemyState = EnemyState;

            if (battleState.PlayerMonster.CurrentHP >= 100)
                battleState.PlayerMonster.CurrentHP = 100;

            //player lose
            if (battleState.PlayerMonster.CurrentHP <= 0)
            {
                battleState.PlayerMonster.CurrentHP = 0;
                battleState.PlayerMonster.IsFighting = false;
                battleState.Victory = false;
                battleState.Status = BattleStatus.Completed;

                await _context.SaveChangesAsync();

                return Ok( new { success = true, battleState, playerAttack, enemyAttack });

            }

            //player won
            if (battleState.EnemyMonster.CurrentHP <= 0)
            {
                battleState.EnemyMonster.CurrentHP = 0;
                battleState.PlayerMonster.IsFighting = false;
                User.TotalVictory += 1;
                battleState.Victory = true;
                battleState.Status = BattleStatus.Completed;

                //give victory reward to player

                await _context.SaveChangesAsync();

                return Ok( new { success = true, battleState, playerAttack, enemyAttack });
            }
            
            enemyAttack = _battleService.EnemyAttack(ref battleState, ref EnemyState, ref PlayerState);

            battleState.PlayerState = PlayerState;
            battleState.EnemyState = EnemyState;
            
            if (battleState.EnemyMonster.CurrentHP >= 100)
                battleState.EnemyMonster.CurrentHP = 100;

            //enemy loase
            if (battleState.EnemyMonster.CurrentHP <= 0)
            {
                battleState.EnemyMonster.CurrentHP = 0;
                battleState.PlayerMonster.IsFighting = false;
                User.TotalVictory += 1;
                battleState.Victory = true;
                battleState.Status = BattleStatus.Completed;


                //give victory reward to player

                
            }

            //player lose
            if (battleState.PlayerMonster.CurrentHP <= 0)
            {
                battleState.PlayerMonster.CurrentHP = 0;
                battleState.PlayerMonster.IsFighting = false;
                battleState.Victory = false;
                battleState.Status = BattleStatus.Completed;
            }

            await _context.SaveChangesAsync();

            return Ok( new { success = true, battleState, playerAttack, enemyAttack }); 
        }




        [HttpPost("monster/catch")]
        public async Task<IActionResult> CatchMonster()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);
            
            var form = await GetForm( new
            {
                BattleId = new Guid()
            });

            BattleState battleState = await _context.Battles.Include(b => b.PlayerMonster).Include(b => b.EnemyMonster).FirstOrDefaultAsync(b => b.BattleId == form.BattleId);
            if (battleState == null)
                return Ok(new { success = false });
            
            if (battleState.PlayerId != User.ID)
                return Ok( new { success = false });
            
            if (battleState.Status != BattleStatus.Active)
                return Ok( new { success = false, reason = "battle is ended" });
            
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = false, reason = "battle is forfeited"});
            }

            if (User.Items.MonstaBall <= 0)
                return Ok( new { success = false, reason = "not enough monsta ball"});

            
            var oddRanges = _gameplayService.GetCatchOddsRange(battleState.EnemyMonster.Level);
            if (oddRanges == null || oddRanges.Data == null || !oddRanges.Data.Any())
                return Ok(new { success = false, reason = "no catch data for this level" });

            float hpPct = (float)battleState.EnemyMonster.CurrentHP / 100f;
            var odds = oddRanges.Data.OrderByDescending(x => x.At).FirstOrDefault(x => hpPct >= x.At) 
                        ?? oddRanges.Data.OrderBy(x => x.At).First();

            battleState.TurnCount += 1;
            Random random = new Random();

            if (User.Items.MonstaBall > 0)
                User.Items.MonstaBall -= 1;
            
            if (random.NextDouble() <= odds.Odds)
            {
                battleState.EnemyMonster.OwnerID = User.ID;
                User.Monsters.Add(battleState.EnemyMonster.InstanceId);
                User.TotalVictory += 1;
                battleState.Victory = true;
                battleState.PlayerMonster.IsFighting = false;
                battleState.EnemyMonster.CaptureAt = DateTime.UtcNow;
                battleState.Status = BattleStatus.Completed;
                
                //give the victory rewards

                await _context.SaveChangesAsync();
                return Ok( new { success = true, battleState, capture = true });
                
            }

            //catch is unsuccessful, let enemy attack
            MonsterState PlayerState = battleState.PlayerState;
            MonsterState EnemyState = battleState.EnemyState;

            AttackResult enemyAttack = _battleService.EnemyAttack(ref battleState, ref EnemyState, ref PlayerState);

            battleState.PlayerState = PlayerState;
            battleState.EnemyState = EnemyState;
            
            if (battleState.EnemyMonster.CurrentHP >= 100)
                battleState.EnemyMonster.CurrentHP = 100;

            //enemy loase
            if (battleState.EnemyMonster.CurrentHP <= 0)
            {
                battleState.EnemyMonster.CurrentHP = 0;
                battleState.PlayerMonster.IsFighting = false;
                User.TotalVictory += 1;
                battleState.Victory = true;
                battleState.Status = BattleStatus.Completed;


                //give victory reward to player

                
            }

            //player lose
            if (battleState.PlayerMonster.CurrentHP <= 0)
            {
                battleState.PlayerMonster.CurrentHP = 0;
                battleState.PlayerMonster.IsFighting = false;
                battleState.Victory = false;
                battleState.Status = BattleStatus.Completed;
            }

            await _context.SaveChangesAsync();

            return Ok( new { success = true, battleState, capture = false, enemyAttack }); 
            
        }

        [HttpPost("battle/escape")]
        public async Task<IActionResult> EscapeBattle()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user); //testuser
            var form = await GetForm( new
            {
                BattleId = new Guid()
            });

            BattleState battleState = await _context.Battles.Include(b => b.PlayerMonster).Include(b => b.EnemyMonster).FirstOrDefaultAsync(b => b.BattleId == form.BattleId);
            if (battleState == null)
                return Ok(new { success = false });
            
            if (battleState.PlayerId != User.ID)
                return Ok( new { success = false });
            
            if (battleState.Status != BattleStatus.Active)
                return Ok( new { success = true, reason = "battle is ended" });
            
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = true, reason = "battle is forfeited"});
            }

            battleState.Status = BattleStatus.Forfeited;
            battleState.PlayerMonster.IsFighting = false;
            

            await _context.SaveChangesAsync();

            return Ok( new { success = true, battleState });
        }

        [HttpPost("items")]
        public async Task<IActionResult> Items()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            return Ok(new { success = true, Items = User.Items });
        }

        [HttpPost("inventory")]
        public async Task<IActionResult> Inventory()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user); //testuser

            var form = await GetForm(new { pageIndex = 0 });

            int startIndex = 6 * form.pageIndex;

            var monsterIds = (User.Monsters ?? Enumerable.Empty<string>())
                .Skip(startIndex)
                .Take(6)
                .ToList();

            if (!monsterIds.Any())
            {
                return Ok(new { success = true, Monsters = new List<Monster>(), totalMonsters = User.Monsters.Count() });
            }

            var monsters = await _context.Monsters
                .Where(m => monsterIds.Contains(m.InstanceId))
                .ToListAsync();

            return Ok(new { success = true, Monsters = monsters, totalMonsters = User.Monsters.Count() });
        }


        private static double _cachedTonPrice = 0;
        private static DateTime _priceCacheExpiration = DateTime.MinValue;
        private static SemaphoreSlim? _priceCacheLock;
        private static SemaphoreSlim PriceCacheLock => _priceCacheLock ??= new SemaphoreSlim(1, 1);

        public async Task<double> GetTonPrice()
        {
            if (DateTime.UtcNow < _priceCacheExpiration && _cachedTonPrice > 0)
            {
                return _cachedTonPrice;
            }

            await PriceCacheLock.WaitAsync();
            try
            {
                // Double check after acquiring lock
                if (DateTime.UtcNow < _priceCacheExpiration && _cachedTonPrice > 0)
                {
                    return _cachedTonPrice;
                }

                if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
                {
                    _httpClient.DefaultRequestHeaders.Add("User-Agent", "MonsterWorldApp/1.0");
                }

                // Primary API: Gate.io (fast, free, very high rate limit)
                string url = "https://api.gateio.ws/api/v4/spot/tickers?currency_pair=TON_USDT";
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    
                    if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                    {
                        var lastStr = doc.RootElement[0].GetProperty("last").GetString();
                        if (double.TryParse(lastStr, System.Globalization.CultureInfo.InvariantCulture, out double parsedPrice) && parsedPrice > 0)
                        {
                            _cachedTonPrice = parsedPrice;
                            _priceCacheExpiration = DateTime.UtcNow.AddSeconds(30);
                            return _cachedTonPrice;
                        }
                    }
                }

                // Fallback API: CoinGecko (slower, low rate limit)
                string fallbackUrl = "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currency=usd";
                var fallbackResponse = await _httpClient.GetAsync(fallbackUrl);
                if (fallbackResponse.IsSuccessStatusCode)
                {
                    var json = await fallbackResponse.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    double parsedPrice = (double)doc.RootElement
                        .GetProperty("the-open-network")
                        .GetProperty("usd")
                        .GetDecimal();
                    if (parsedPrice > 0)
                    {
                        _cachedTonPrice = parsedPrice;
                        _priceCacheExpiration = DateTime.UtcNow.AddSeconds(30);
                        return _cachedTonPrice;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching TON price: {ex.Message}");
            }
            finally
            {
                PriceCacheLock.Release();
            }

            // Return last successfully cached price, or 5.0 as a safe fallback if never loaded
            return _cachedTonPrice > 0 ? _cachedTonPrice : 5.0;
        }

        private readonly List<string> ExchangePairs = new() { "TON:GOLD", "EGGS:TON"};
        [ValidateRequestIgnore]
        [HttpPost("exchange-terms")]
        public async Task<IActionResult> ExchangeTerms()
        {
            var EGGSPriceUSDT = await _poolService.GetEggsPrice();
            var EGGSPriceTON = EGGSPriceUSDT / await GetTonPrice();

            Dictionary<string, string> PairValues = new() { 
                {"TON:GOLD" , "1:100"},
                {"EGGS:TON", "1:"+EGGSPriceTON }
            };

            return Ok(new { success = true, ExchangePairs, PairValues, EGGSPriceUSDT, EGGSPriceTON });
        }


        [HttpPost("exchange")]
        public async Task<IActionResult> Exchange()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);
            UserAnalytics analytics = await _context.Analytics.FirstOrDefaultAsync(x => x.ID == User.ID);

            POOL pool = await _context.Pool.FirstAsync();

            var form = await GetForm(new
            {
                To = "",
                From = "",
                Amount = 0d
            });
            
            if (!ExchangePairs.Contains(form.From+":"+form.To))
                return Ok(new { success = false, reason = "pair not found"});


            if (form.From == "EGGS")
            {
                if (User.Balance.EGGS > form.Amount && form.Amount > 0)
                {
                   
                    double EGGSPrice = await _poolService.GetEggsPrice();
                    double ExchangePrice = form.Amount * EGGSPrice;
                    double TONConversion = ExchangePrice / await GetTonPrice();

                    await _poolService.BurnEggsSupply(form.Amount);
                    await _poolService.RemoveUSDTLiquidity(ExchangePrice);

                    analytics.TotalExchanged += ExchangePrice;
                
                    User.Credit("EGGS", -form.Amount, $"exhange=EGGStoTON");
                    User.Credit("TON", TONConversion, $"exchagne=EGGStoTON");

                    await _context.SaveChangesAsync();
                }
                else
                {
                    return Ok(new{ success = false, reason = "insufficient balance"});
                }
            }
            else if (form.From == "TON" && form.To == "GOLD")
            {
                if (User.Balance.TON > form.Amount && form.Amount > 0)
                {
                    double USDTLiquidity = form.Amount * await GetTonPrice();
                    double GOLDConversion = USDTLiquidity * 100; //Static GOLD price
                    await _poolService.AddUSDTLiquidity(USDTLiquidity);

                    analytics.TotalInvested += USDTLiquidity;

                    User.Credit("TON", -form.Amount, "exchange=TONtoGOLD");
                    User.Credit("GOLD", GOLDConversion, "exchange=TONtoGOLD");

                    await _context.SaveChangesAsync();

                }
                else
                {
                    return Ok(new{ success = false, reason = "insufficient balance"});
                }
            }

            return Ok(new{ success = true, User, pool});
        }
        [ValidateRequestIgnore]
        [HttpGet("add/monster/{name}")]
        public async Task<IActionResult> AddMonsters(string name)
        {
            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.ID == 7243182477);

            Monster monster = _gameplayService.CreateMonsterInstance(name, User.ID, 10);
            User.Monsters.Add(monster.InstanceId);

            await _context.Monsters.AddAsync(monster);
            await _context.SaveChangesAsync();
            return Ok(new{monster});
        }

        [ValidateRequestIgnore]
        [HttpGet("heal-all/{username}")]
        public async Task<IActionResult> HealAll(string username){
            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.Username == username);

            var monsters = await _context.Monsters.Where(x => User.Monsters.Contains(x.InstanceId)).ToListAsync();
            
            foreach(var monster in monsters)
            {
                monster.CurrentHP = 100;
            }
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
            
        }

        [ValidateRequestIgnore]
        [HttpGet("add/items/{username}")]
        public async Task<IActionResult> AddItems( string username)
        {
            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.Username == username );
            User.Items.MonstaBall += 10;

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("monster/heal")]
        public async Task<IActionResult> HealMonster()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm( new {
                MonsterId = ""
            });

            Monster monster = await _context.Monsters.FirstOrDefaultAsync( x => x.InstanceId == form.MonsterId);

            if(monster == null)
                return Ok(new { success = false, reason = "monster not found"});

            if (monster.OwnerID != User.ID)
                return Ok(new { success = false, reason = "not an owner"});
            
            if (monster.CurrentHP == 100)
                return Ok(new { success = false, reason = "hp is already max"});

            HealingCost HealingCost = _gameplayService.GetHealSprayTable(monster.Level);

            if (!(User.Items.HealSpell >= HealingCost.HealSpell))
                return Ok(new { success = false, reason = "not enough healings", required = HealingCost });

            User.Items.HealSpell -= HealingCost.HealSpell;

            monster.CurrentHP = 100;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, monster });
        }

        public class MonsterInfo
        {
            public string InstanceId { get; set; }
            public string Id { get; set; }
            public long OwnerID { get; set; }
            public string Title { get; set; }
            public string Kind { get; set; }
            public string Desc { get; set; }
            public int Level { get; set; }
            public int XP { get; set; }
            public int HP { get; set; }
            public int Aim { get; set; }
            public int Attack { get; set; }
            public int Defence { get; set; }
            public List<MonsterAbility> Abilities { get; set; } = new();
            public List<string> Logs { get; set; } = new();
            public DateTime CapturedAt { get; set; }
        }
        
        [HttpPost("monster/info")]
        public async Task<IActionResult> GetMonsterInfo()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm(new
            {
                monsterId = ""
            });

            if (!User.Monsters.Contains(form.monsterId))
                return Ok(new { success = false, reason = "no such monster in inventory"});

            Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == form.monsterId);

            if (monster == null)
                return Ok(new { success = false, reason = "monster not found" });

            
            if (monster.OwnerID != User.ID)
                return Ok(new { success = false, reason = "not an owner"});


            MonsterDef def = _gameplayService.GetMonsterDef(monster.Id);
            LevelTable levelTable = _gameplayService.GetLevelTable(def.LvlTableId);
            LevelStat stat = levelTable.LvlTable.FirstOrDefault(x => x.Lvl == monster.Level);
            MonsterInfo Info = new()
            {
                InstanceId = monster.InstanceId,
                Id = monster.Id,
                OwnerID = monster.OwnerID,
                Title = monster.Title,
                Kind = monster.Kind,
                Desc = def.Desc,
                Level = monster.Level,
                XP = monster.XP,
                HP = monster.CurrentHP,
                Aim = stat.Aim,
                Attack = stat.Atk,
                Defence = stat.Def,
                Abilities = def.Abilities.DistinctBy(x => x.Id).ToList(),
                Logs = monster.Logs,
                CapturedAt = monster.CaptureAt
            };

            return Ok( new { success = true, Info });
        }


        [HttpPost("shop")]
        public async Task<IActionResult> Shop()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            List<Listed> ListedItems = await _context.ShopItems.Where(x => x.IsAvailable && x.AvailableTill > DateTime.UtcNow && x.Stock > 0).ToListAsync();
            
            return Ok(new { success = true, ListedItems });
            
        }

        [ValidateRequestIgnore]
        [HttpPost("list/items")]
        public async Task<IActionResult> ListItem()
        {
            var form = await GetForm(new
            {
                PayloadId = "",
                Name = "",
                Category = "",
                Description = "",
                Gold = 0d,
                Stock = 0
            });

            Listed Item = new()
            {
                PayloadId = form.PayloadId,
                Name = form.Name,
                Category = form.Category,
                Description = form.Description,
                GOLD = form.Gold,                 
                Stock = form.Stock,
                IsAvailable = true,
                AvailableTill = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };

            await _context.AddAsync(Item);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, Item });


        }
        

        // [HttpPost("missions")]
        // public async Task<IActionResult> GetMissions()
        // {
        //     HttpContext.Items.TryGetValue("User", out var user);
        //     UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

        // }
    }
}