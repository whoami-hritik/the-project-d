using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using monster_world.DBContext;
using monster_world.Models;
using monster_world.Services;
using monster_world.Filters;
using monster_world.Models.Dto;

namespace monster_world.Controller
{
    [ValidateRequest]
    [ApiController]
    [Route("monsterworld/marketplace")]
    public class MarketpalceController : EnhanceController
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly GameplayService _gameplayService;
        private readonly PoolService _poolService;
        private readonly TGBOT.TelegramBot _tgbot;

        public MarketpalceController(
            AppDbContext context,
            UserService userService,
            GameplayService gameplayService,
            PoolService poolService,
            TGBOT.TelegramBot tgbot
            )
        {
            _context = context;
            _userService = userService;
            _gameplayService = gameplayService;
            _poolService = poolService;
            _tgbot = tgbot;
        }

        [HttpPost("")]
        public async Task<IActionResult> GetMarketplace()
        {
            var form = await GetForm(new {
                ListingType = "monster",
                PageIndex = 0,
                PageSize = 10,
                SearchQuery = "",
                FilterType = "public"
            });

            HttpContext.Items.TryGetValue("User", out var userObj);
            long currentUserId = 0;
            if (userObj != null)
            {
                UserBase User = await _userService.GetOrCreateUser((TelegramUser)userObj);
                if (User != null)
                {
                    currentUserId = User.ID;
                }
            }

            if (form.ListingType == "monster")
            {
                int startIndex = form.PageSize * form.PageIndex;

                var query = from mkt in _context.Marketplace
                            join mon in _context.Monsters on mkt.MonsterId equals mon.InstanceId
                            join sel in _context.Users on mkt.SellerId equals sel.ID
                            where !mkt.IsSold && mkt.ListingType == "monster"
                            select new { mkt, mon, SellerUsername = sel.Username, SellerLevel = sel.Level };

                if (form.FilterType == "my_listings")
                {
                    query = query.Where(x => x.mkt.SellerId == currentUserId);
                }
                else
                {
                    query = query.Where(x => x.mkt.SellerId != currentUserId);
                }

                if (!string.IsNullOrEmpty(form.SearchQuery))
                {
                    string search = form.SearchQuery.ToLower();
                    query = query.Where(x => x.mon.Title.ToLower().Contains(search));
                }

                var listingsWithMonsters = await query
                    .OrderByDescending(x => x.mkt.ListedDate)
                    .Skip(startIndex)
                    .Take(form.PageSize)
                    .ToListAsync();

                foreach (var item in listingsWithMonsters)
                {
                    if (item.mon != null)
                    {
                        var rates = _gameplayService.CalculateMonsterRates(item.mon);
                        item.mon.GoldRate = rates.GoldRate;
                        item.mon.CrystalRate = rates.CrystalRate;
                    }
                }

                var result = listingsWithMonsters.Select(x => new {
                    x.mkt.ID,
                    x.mkt.SellerId,
                    x.mkt.ListingType,
                    x.mkt.MonsterId,
                    x.mkt.Price,
                    x.mkt.Currency,
                    x.mkt.Quantity,
                    x.mkt.InitialQuantity,
                    x.mkt.ListedDate,
                    SellerUsername = x.SellerUsername,
                    SellerLevel = x.SellerLevel,
                    Monster = x.mon
                }).ToList();

                return Ok(result);
            }

            if (form.ListingType == "item")
            {
                int startIndex = form.PageSize * form.PageIndex;

                var query = from mkt in _context.Marketplace
                            join sel in _context.Users on mkt.SellerId equals sel.ID
                            where !mkt.IsSold && mkt.ListingType == "item"
                            select new { mkt, SellerUsername = sel.Username, SellerLevel = sel.Level };

                if (form.FilterType == "my_listings")
                {
                    query = query.Where(x => x.mkt.SellerId == currentUserId);
                }
                else
                {
                    query = query.Where(x => x.mkt.SellerId != currentUserId);
                }

                if (!string.IsNullOrEmpty(form.SearchQuery))
                {
                    string search = form.SearchQuery.ToLower();
                    query = query.Where(x => x.mkt.ItemId.ToLower().Contains(search));
                }

                var listingsWithItems = await query
                    .OrderByDescending(x => x.mkt.ListedDate)
                    .Skip(startIndex)
                    .Take(form.PageSize)
                    .ToListAsync();

                var result = listingsWithItems.Select(x => new {
                    x.mkt.ID,
                    x.mkt.SellerId,
                    x.mkt.ListingType,
                    x.mkt.ItemId,
                    x.mkt.Price,
                    x.mkt.Currency,
                    x.mkt.Quantity,
                    x.mkt.InitialQuantity,
                    x.mkt.ListedDate,
                    SellerUsername = x.SellerUsername,
                    SellerLevel = x.SellerLevel
                }).ToList();

                return Ok(result);
            }

            return Ok(new List<object>());
        }

        [HttpPost("list")]
        public async Task<IActionResult> ListInMarketplace()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);
            var form = await GetForm(new {
                Id = "",
                ListingType = "",
                Price = 1d,
                Currency = "TON",
                Quantity = 1
            });

            if (form.Id == "" || form.ListingType == "")
            {
                return Ok(new { success = false, reason = "invalid listing parameters" });
            }
            if (form.Price <= 0)
            {
                return Ok(new { success = false, reason = "invalid price" });
            }
            if (form.ListingType == "monster" && form.Currency != "TON")
            {
                return Ok(new { success = false, reason = "monsters can only be listed for TON" });
            }
            if (form.ListingType == "item" && form.Currency != "CRYSTAL")
            {
                return Ok(new { success = false, reason = "items can only be listed for CRYSTAL" });
            }

            using (var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
            {
                try
                {
                    if (form.ListingType == "monster")
                    {
                        if (User.Monsters == null) User.Monsters = new List<string>();
                        if (User.ListedMonsters == null) User.ListedMonsters = new List<string>();
                        if (User.StakedMonsters == null) User.StakedMonsters = new List<string>();

                        if (!User.Monsters.Contains(form.Id))
                        {
                            return Ok(new { success = false, reason = "monster not in inventory" });
                        }
                        if (User.ListedMonsters.Contains(form.Id))
                        {
                            return Ok(new { success = false, reason = "monster already listed" });
                        }

                        Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == form.Id);
                        if (monster == null)
                        {
                            return Ok(new { success = false, reason = "monster not found" });
                        }

                        if (monster.OwnerID != User.ID)
                        {
                            return Ok(new { success = false, reason = "monster not owned" });
                        }

                        if (monster.StakedInCollector)
                        {
                            User.StakedMonsters.Remove(monster.InstanceId);
                            monster.StakedInCollector = false;   
                        }

                        User.Monsters.Remove(monster.InstanceId);
                        User.ListedMonsters.Add(monster.InstanceId);
                        _context.Users.Update(User);

                        MarketplaceBase marketplaceBase = new MarketplaceBase()
                        {
                            MonsterId = monster.InstanceId,
                            SellerId = User.ID,
                            ListingType = form.ListingType,
                            Price = form.Price,
                            Currency = form.Currency,
                            Quantity = 1,
                            InitialQuantity = 1,
                            ListedDate = DateTime.UtcNow,
                            IsSold = false,
                            BuyerId = -1,
                            SoldDate = DateTime.MinValue
                        };
                        _context.Marketplace.Add(marketplaceBase);

                        MarketplaceLog log = new MarketplaceLog()
                        {
                            ActivityType = "List",
                            ListingType = "monster",
                            SellerId = User.ID,
                            SellerUsername = User.Username,
                            TargetId = monster.Id,
                            MonsterInstanceId = monster.InstanceId,
                            MonsterLevel = monster.Level,
                            Details = $"{monster.Title} (Level {monster.Level})",
                            Price = form.Price,
                            Currency = form.Currency,
                            Quantity = 1,
                            Timestamp = DateTime.UtcNow
                        };
                        _context.MarketplaceLogs.Add(log);
                    }
                    else if (form.ListingType == "item")
                    {
                        if (form.Id.ToLower() != "monstaball")
                        {
                            return Ok(new { success = false, reason = "only monstaball can be listed for now" });
                        }
                        if (form.Quantity <= 0)
                        {
                            return Ok(new { success = false, reason = "invalid quantity" });
                        }
                        if (User.Items == null || User.Items.MonstaBall < form.Quantity)
                        {
                            return Ok(new { success = false, reason = "insufficient items in inventory" });
                        }

                        User.AddItems("MonstaBall", -form.Quantity, "List in Marketplace");
                        _context.Users.Update(User);

                        MarketplaceBase marketplaceBase = new MarketplaceBase()
                        {
                            ItemId = "MonstaBall",
                            SellerId = User.ID,
                            ListingType = form.ListingType,
                            Price = form.Price,
                            Currency = form.Currency,
                            Quantity = form.Quantity,
                            InitialQuantity = form.Quantity,
                            ListedDate = DateTime.UtcNow,
                            IsSold = false,
                            BuyerId = -1,
                            SoldDate = DateTime.MinValue
                        };
                        _context.Marketplace.Add(marketplaceBase);

                        MarketplaceLog log = new MarketplaceLog()
                        {
                            ActivityType = "List",
                            ListingType = "item",
                            SellerId = User.ID,
                            SellerUsername = User.Username,
                            TargetId = "MonstaBall",
                            Details = "MonstaBall",
                            Price = form.Price,
                            Currency = form.Currency,
                            Quantity = form.Quantity,
                            Timestamp = DateTime.UtcNow
                        };
                        _context.MarketplaceLogs.Add(log);
                    }
                    
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User) });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        [HttpPost("buy")]
        public async Task<IActionResult> BuyInMarketplace()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);
            var form = await GetForm(new {
                MarketplaceId = Guid.Empty
            });

            using (var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
            {
                try
                {
                    MarketplaceBase marketplaceBase = await _context.Marketplace.FirstOrDefaultAsync(x => x.ID == form.MarketplaceId);
                    if (marketplaceBase == null)
                    {
                        return Ok(new { success = false, reason = "marketplace listing not found" });
                    }

                    if (marketplaceBase.SellerId == User.ID)
                    {
                        return Ok(new { success = false, reason = "you can't buy your own listing" });
                    }

                    if (marketplaceBase.IsSold)
                    {
                        return Ok(new { success = false, reason = "this listing has already been sold" });
                    }

                    double commissionFactor = _gameplayService.Gameplay.Marketplace.CommissionFactor;
                    double commissionAmount = marketplaceBase.Price * commissionFactor;

                    var seller = await _context.Users.FirstOrDefaultAsync(u => u.ID == marketplaceBase.SellerId);

                    if (marketplaceBase.ListingType == "monster")
                    {
                        Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == marketplaceBase.MonsterId);
                        if (monster == null)
                        {
                            return Ok(new { success = false, reason = "monster not found" });
                        }

                        if (monster.OwnerID != marketplaceBase.SellerId)
                        {
                            return Ok(new { success = false, reason = "monster owner mismatch" });
                        }

                        if (User.Balance.TON < marketplaceBase.Price)
                        {
                            return Ok(new { success = false, reason = "insufficient TON balance" });
                        }

                        if (seller != null)
                        {
                            if (seller.ListedMonsters == null) seller.ListedMonsters = new List<string>();
                            if (seller.Transactions == null) seller.Transactions = new List<string>();
                            seller.ListedMonsters.Remove(monster.InstanceId);
                            
                            seller.Credit("TON", marketplaceBase.Price, $"sell_monster={monster.InstanceId}");
                            
                            if (commissionAmount > 0)
                            {
                                seller.Credit("TON", -commissionAmount, $"marketplace_commission={monster.InstanceId}");
                            }
                            
                            _context.Users.Update(seller);
                        }

                        if (User.Transactions == null) User.Transactions = new List<string>();
                        User.Credit("TON", -marketplaceBase.Price, $"buy_monster={monster.InstanceId}");
                        if (User.Monsters == null) User.Monsters = new List<string>();
                        User.Monsters.Add(monster.InstanceId);
                        _context.Users.Update(User);

                        monster.OwnerID = User.ID;
                        _context.Monsters.Update(monster);

                        marketplaceBase.IsSold = true;
                        marketplaceBase.BuyerId = User.ID;
                        marketplaceBase.SoldDate = DateTime.UtcNow;
                        _context.Marketplace.Update(marketplaceBase);

                        MarketplaceLog log = new MarketplaceLog()
                        {
                            ActivityType = "Buy",
                            ListingType = "monster",
                            SellerId = seller?.ID ?? 0,
                            SellerUsername = seller?.Username,
                            BuyerId = User.ID,
                            BuyerUsername = User.Username,
                            TargetId = monster.Id,
                            MonsterInstanceId = monster.InstanceId,
                            MonsterLevel = monster.Level,
                            Details = $"{monster.Title} (Level {monster.Level})",
                            Price = marketplaceBase.Price,
                            Currency = marketplaceBase.Currency,
                            Quantity = 1,
                            Timestamp = DateTime.UtcNow
                        };
                        _context.MarketplaceLogs.Add(log);

                        double totalSaleVolume = _context.Marketplace.Where(m => m.IsSold && m.ListingType == "monster").Sum(m => m.Price);
                        double totalCommissionVolume = totalSaleVolume * commissionFactor;

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        // Send Telegram Notifications in background to avoid blocking the HTTP response
                        _ = Task.Run(async () =>
                        {
                            if (seller != null)
                            {
                                try
                                {
                                    double receivedAmount = marketplaceBase.Price - commissionAmount;
                                    string sellerMsg = $"💰 <b>Monster Sold!</b>\n\n" +
                                                       $"Your monster <b>{monster.Title}</b> has been sold to User ID <code>{User.ID}</code>.\n" +
                                                       $"• Level: <code>{monster.Level}</code>\n" +
                                                       $"• Monster Hash: <code>{monster.InstanceId}</code>\n" +
                                                       $"• Sale Price: <code>{marketplaceBase.Price:F2} TON</code>\n" +
                                                       $"• Commission ({(commissionFactor * 100):F0}%): <code>{commissionAmount:F2} TON</code>\n" +
                                                       $"• Net Credited: <code>{receivedAmount:F2} TON</code>";
                                    
                                    await _tgbot.Notify(seller.ID, sellerMsg);
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[TELEGRAM_BOT] Failed to notify seller: {ex.Message}");
                                }
                            }

                            try
                            {
                                string buyerMsg = $"🛍️ <b>Successful Purchase!</b>\n\n" +
                                                  $"You have successfully purchased <b>{monster.Title}</b>.\n" +
                                                  $"• Level: <code>{monster.Level}</code>\n" +
                                                  $"• Price Paid: <code>{marketplaceBase.Price:F2} TON</code>\n" +
                                                  $"• Monster Hash: <code>{monster.InstanceId}</code>";

                                await _tgbot.Notify(User.ID, buyerMsg);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[TELEGRAM_BOT] Failed to notify buyer: {ex.Message}");
                            }

                            // Send Telegram Notification to Admin (7243182477)
                            try
                            {
                                string adminMsg = $"📢 <b>Marketplace Transaction Log</b>\n\n" +
                                                  $"👾 Monster: <b>{monster.Title}</b>\n" +
                                                  $"• Level: <code>{monster.Level}</code>\n" +
                                                  $"• Monster Hash: <code>{monster.InstanceId}</code>\n" +
                                                  $"• Seller ID: <code>{seller?.ID}</code>\n" +
                                                  $"• Buyer ID: <code>{User.ID}</code>\n" +
                                                  $"• Sale Price: <code>{marketplaceBase.Price:F2} TON</code>\n" +
                                                  $"• Commission ({(commissionFactor * 100):F0}%): <code>{commissionAmount:F2} TON</code>\n\n" +
                                                  $"📊 <b>Marketplace Analytics:</b>\n" +
                                                  $"• Total Cumulative Sales: <code>{totalSaleVolume:F2} TON</code>\n" +
                                                  $"• Total Commission Revenue: <code>{totalCommissionVolume:F2} TON</code>";

                                await _tgbot.Notify(7243182477, adminMsg);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[TELEGRAM_BOT] Failed to notify admin 7243182477: {ex.Message}");
                            }
                        });
                    }
                    else if (marketplaceBase.ListingType == "item")
                    {
                        if (marketplaceBase.Quantity <= 0)
                        {
                            return Ok(new { success = false, reason = "item is out of stock" });
                        }

                        if (User.Balance.CRYSTAL < marketplaceBase.Price)
                        {
                            return Ok(new { success = false, reason = "insufficient CRYSTAL balance" });
                        }

                        if (seller != null)
                        {
                            if (seller.Transactions == null) seller.Transactions = new List<string>();
                            seller.Credit("CRYSTAL", marketplaceBase.Price, $"sell_item={marketplaceBase.ItemId}_qty=1");
                            if (commissionAmount > 0)
                            {
                                seller.Credit("CRYSTAL", -commissionAmount, $"marketplace_commission_item={marketplaceBase.ItemId}");
                            }
                            _context.Users.Update(seller);
                        }

                        if (User.Transactions == null) User.Transactions = new List<string>();
                        User.Credit("CRYSTAL", -marketplaceBase.Price, $"buy_item={marketplaceBase.ItemId}_qty=1");
                        User.AddItems(marketplaceBase.ItemId, 1, $"buy_item={marketplaceBase.ID}");
                        _context.Users.Update(User);

                        marketplaceBase.Quantity -= 1;
                        if (marketplaceBase.Quantity <= 0)
                        {
                            marketplaceBase.IsSold = true;
                            marketplaceBase.BuyerId = User.ID;
                            marketplaceBase.SoldDate = DateTime.UtcNow;
                        }
                        _context.Marketplace.Update(marketplaceBase);

                        MarketplaceLog log = new MarketplaceLog()
                        {
                            ActivityType = "Buy",
                            ListingType = "item",
                            SellerId = seller?.ID ?? 0,
                            SellerUsername = seller?.Username,
                            BuyerId = User.ID,
                            BuyerUsername = User.Username,
                            TargetId = marketplaceBase.ItemId,
                            Details = marketplaceBase.ItemId,
                            Price = marketplaceBase.Price,
                            Currency = marketplaceBase.Currency,
                            Quantity = 1,
                            Timestamp = DateTime.UtcNow
                        };
                        _context.MarketplaceLogs.Add(log);

                        double totalSaleVolume = _context.Marketplace.Where(m => m.IsSold && m.ListingType == "item").Sum(m => m.Price);
                        double totalCommissionVolume = totalSaleVolume * commissionFactor;

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        // Send Telegram Notifications in background to avoid blocking the HTTP response
                        _ = Task.Run(async () =>
                        {
                            if (seller != null)
                            {
                                try
                                {
                                    double receivedAmount = marketplaceBase.Price - commissionAmount;
                                    string sellerMsg = $"💰 <b>Item Sold!</b>\n\n" +
                                                       $"Your item <b>{marketplaceBase.ItemId} (x1)</b> has been sold to User ID <code>{User.ID}</code>.\n" +
                                                       $"• Sale Price: <code>{marketplaceBase.Price:F2} CRYSTAL</code>\n" +
                                                       $"• Commission ({(commissionFactor * 100):F0}%): <code>{commissionAmount:F2} CRYSTAL</code>\n" +
                                                       $"• Net Credited: <code>{receivedAmount:F2} CRYSTAL</code>";
                                    
                                    await _tgbot.Notify(seller.ID, sellerMsg);
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[TELEGRAM_BOT] Failed to notify seller: {ex.Message}");
                                }
                            }

                            try
                            {
                                string buyerMsg = $"🛍️ <b>Successful Purchase!</b>\n\n" +
                                                  $"You have successfully purchased <b>{marketplaceBase.ItemId} (x1)</b>.\n" +
                                                  $"• Price Paid: <code>{marketplaceBase.Price:F2} CRYSTAL</code>";

                                await _tgbot.Notify(User.ID, buyerMsg);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[TELEGRAM_BOT] Failed to notify buyer: {ex.Message}");
                            }

                            // Send Telegram Notification to Admin (7243182477)
                            try
                            {
                                string adminMsg = $"📢 <b>Marketplace Item Transaction Log</b>\n\n" +
                                                  $"📦 Item: <b>{marketplaceBase.ItemId} (x1)</b>\n" +
                                                  $"• Seller ID: <code>{seller?.ID}</code>\n" +
                                                  $"• Buyer ID: <code>{User.ID}</code>\n" +
                                                  $"• Sale Price: <code>{marketplaceBase.Price:F2} CRYSTAL</code>\n" +
                                                  $"• Commission ({(commissionFactor * 100):F0}%): <code>{commissionAmount:F2} CRYSTAL</code>\n\n" +
                                                  $"📊 <b>Marketplace Item Analytics:</b>\n" +
                                                  $"• Total Cumulative Item Sales: <code>{totalSaleVolume:F2} CRYSTAL</code>\n" +
                                                  $"• Total Commission Revenue: <code>{totalCommissionVolume:F2} CRYSTAL</code>";

                                await _tgbot.Notify(7243182477, adminMsg);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[TELEGRAM_BOT] Failed to notify admin 7243182477: {ex.Message}");
                            }
                        });
                    }

                    return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User) });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        [HttpPost("remove")]
        public async Task<IActionResult> RemoveMarketplaceListing()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);
            var form = await GetForm(new {
                MarketplaceId = Guid.Empty
            });

            using (var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
            {
                try
                {
                    MarketplaceBase marketplaceBase = await _context.Marketplace.FirstOrDefaultAsync(x => x.ID == form.MarketplaceId);
                    if (marketplaceBase == null)
                    {
                        return Ok(new { success = false, reason = "marketplace listing not found" });
                    }

                    if (marketplaceBase.SellerId != User.ID)
                    {
                        return Ok(new { success = false, reason = "you do not own this listing" });
                    }

                    if (marketplaceBase.IsSold)
                    {
                        return Ok(new { success = false, reason = "this listing has already been completed/sold" });
                    }

                    if (marketplaceBase.ListingType == "monster")
                    {
                        Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == marketplaceBase.MonsterId);
                        if (monster != null)
                        {
                            monster.OwnerID = User.ID;
                            _context.Monsters.Update(monster);
                        }

                        if (User.ListedMonsters == null) User.ListedMonsters = new List<string>();
                        if (User.Monsters == null) User.Monsters = new List<string>();
                        User.ListedMonsters.Remove(marketplaceBase.MonsterId);
                        if (!User.Monsters.Contains(marketplaceBase.MonsterId))
                        {
                            User.Monsters.Add(marketplaceBase.MonsterId);
                        }
                        _context.Users.Update(User);

                        MarketplaceLog log = new MarketplaceLog()
                        {
                            ActivityType = "Delist",
                            ListingType = "monster",
                            SellerId = User.ID,
                            SellerUsername = User.Username,
                            TargetId = monster?.Id ?? marketplaceBase.MonsterId,
                            MonsterInstanceId = marketplaceBase.MonsterId,
                            MonsterLevel = monster?.Level ?? 0,
                            Details = $"{(monster != null ? monster.Title : "Monster")} (Level {(monster != null ? monster.Level : 0)})",
                            Price = marketplaceBase.Price,
                            Currency = marketplaceBase.Currency,
                            Quantity = 1,
                            Timestamp = DateTime.UtcNow
                        };
                        _context.MarketplaceLogs.Add(log);
                    }
                    else if (marketplaceBase.ListingType == "item")
                    {
                        User.AddItems(marketplaceBase.ItemId, marketplaceBase.Quantity, $"remove_item_listing={marketplaceBase.ID}");
                        _context.Users.Update(User);

                        MarketplaceLog log = new MarketplaceLog()
                        {
                            ActivityType = "Delist",
                            ListingType = "item",
                            SellerId = User.ID,
                            SellerUsername = User.Username,
                            TargetId = marketplaceBase.ItemId,
                            Details = marketplaceBase.ItemId,
                            Price = marketplaceBase.Price,
                            Currency = marketplaceBase.Currency,
                            Quantity = marketplaceBase.Quantity,
                            Timestamp = DateTime.UtcNow
                        };
                        _context.MarketplaceLogs.Add(log);
                    }

                    _context.Marketplace.Remove(marketplaceBase);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User) });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        [HttpPost("recommend-price")]
        public async Task<IActionResult> RecommendPrice()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);
            var form = await GetForm(new
            {
                MonsterId = ""
            });

            if (string.IsNullOrEmpty(form.MonsterId))
            {
                return BadRequest(new { success = false, reason = "invalid request parameters" });
            }

            Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == form.MonsterId);
            if (monster == null)
            {
                return BadRequest(new { success = false, reason = "monster not found" });
            }

            string rarity = (monster.Rarity ?? "common").ToLower().Trim();
            var config = _gameplayService.Gameplay.Marketplace ?? new MarketplaceConfig();

            // 1. Base Value by Rarity (from config)
            double basePrice = 0.1;
            if (config.BasePrices != null && config.BasePrices.TryGetValue(rarity, out double cfgPrice))
            {
                basePrice = cfgPrice;
            }
            else
            {
                basePrice = rarity switch
                {
                    "common" => 0.1,
                    "rare" => 0.5,
                    "epic" => 2.0,
                    "legendary" => 5.0,
                    _ => 0.1
                };
            }

            // 2. Level Premium (Gold spent & Crystal spent conversion to TON)
            double levelPremium = 0;
            if (monster.Level > 1)
            {
                // Level-up gold spent calculation: cumulative gold = 50 * Level * (Level - 1)
                double cumulativeGold = 50.0 * monster.Level * (monster.Level - 1);
                // Convert Gold to TON using config
                double goldToTon = config.GoldToTonRatio > 0 ? config.GoldToTonRatio : 10000.0;
                levelPremium += cumulativeGold / goldToTon;

                // Option 2 Crystal spent calculation (for Epic and Legendary)
                if (rarity == "epic" || rarity == "legendary")
                {
                    double baseFactor = rarity == "epic" ? 3.0 : 5.0;
                    double cumulativeCrystals = baseFactor * monster.Level * (monster.Level - 1) / 2.0;
                    // Convert Crystals to TON using config
                    double crystalToTon = config.CrystalToTonRatio > 0 ? config.CrystalToTonRatio : 200.0;
                    levelPremium += cumulativeCrystals / crystalToTon;
                }

                // Apply Level Premium Discount Factor from config (Option B = 0.15)
                levelPremium *= config.LevelPremiumDiscountFactor;
            }

            double baseFormulaPrice = basePrice + levelPremium;

            // 3. Dynamic Market Average (based on last N sold listings from config)
            double? marketAverage = null;
            int historyLimit = config.MarketAverageHistoryLimit > 0 ? config.MarketAverageHistoryLimit : 5;
            var similarSoldPrices = await _context.Marketplace
                .Where(x => x.IsSold && x.ListingType == "monster")
                .Join(_context.Monsters,
                      item => item.MonsterId,
                      m => m.InstanceId,
                      (item, m) => new { item.Price, item.SoldDate, m.Rarity })
                .Where(x => x.Rarity.ToLower() == rarity)
                .OrderByDescending(x => x.SoldDate)
                .Take(historyLimit)
                .Select(x => x.Price)
                .ToListAsync();

            if (similarSoldPrices.Any())
            {
                marketAverage = similarSoldPrices.Average();
            }

            // Blend using weights from config
            double recommendedPrice = marketAverage.HasValue 
                ? (baseFormulaPrice * config.BaseFormulaWeight) + (marketAverage.Value * config.MarketAverageWeight)
                : baseFormulaPrice;

            // Round to 2 decimal places for neatness
            recommendedPrice = Math.Round(recommendedPrice, 2);

            return Ok(new
            {
                success = true,
                recommendedPrice,
                basePrice,
                levelPremium = Math.Round(levelPremium, 2),
                marketAverage = marketAverage.HasValue ? (double?)Math.Round(marketAverage.Value, 2) : null
            });
        }

        [HttpPost("recommend-item-price")]
        public async Task<IActionResult> RecommendItemPrice()
        {
            var form = await GetForm(new
            {
                ItemId = ""
            });

            if (string.IsNullOrEmpty(form.ItemId))
            {
                return BadRequest(new { success = false, reason = "invalid request parameters" });
            }

            string itemId = form.ItemId.ToLower().Trim();

            // 1. Calculate total crystals in circulation
            double totalCrystals = await _context.Users.SumAsync(u => u.Balance.CRYSTAL);

            // 2. Calculate total items in circulation
            int totalItems = itemId switch
            {
                "monstaball" => await _context.Users.SumAsync(u => u.Items.MonstaBall),
                "ragepotion" => await _context.Users.SumAsync(u => u.Items.RagePotion),
                "windspell" => await _context.Users.SumAsync(u => u.Items.WindSpell),
                "waterfallspell" => await _context.Users.SumAsync(u => u.Items.WaterFallSpell),
                "avalanchespell" => await _context.Users.SumAsync(u => u.Items.AvalancheSpell),
                "lavaspell" => await _context.Users.SumAsync(u => u.Items.LavaSpell),
                "thunderspell" => await _context.Users.SumAsync(u => u.Items.ThunderSpell),
                "darkspell" => await _context.Users.SumAsync(u => u.Items.DarkSpell),
                "healspell" => await _context.Users.SumAsync(u => u.Items.HealSpell),
                "shield" => await _context.Users.SumAsync(u => u.Items.Shield),
                "poison" => await _context.Users.SumAsync(u => u.Items.Poison),
                "hallucinogen" => await _context.Users.SumAsync(u => u.Items.Hallucinogen),
                _ => 0
            };

            // 3. Apply Supply/Demand Pricing Algorithm (Target 1 - 5 CRYSTAL)
            // Midpoint price is 3.0 CRYSTAL
            double basePrice = 3.0; 
            double targetRatio = 10.0; // target ratio of Crystals per item

            double ratio = totalCrystals / (double)Math.Max(1, totalItems);
            double recommendedPrice = basePrice * (ratio / targetRatio);

            // Clamp between 1.0 and 5.0 CRYSTAL
            recommendedPrice = Math.Clamp(recommendedPrice, 1.0, 5.0);

            // Round to 1 decimal place for neatness
            recommendedPrice = Math.Round(recommendedPrice, 1);

            return Ok(new
            {
                success = true,
                recommendedPrice,
                totalCrystals,
                totalItems
            });
        }
    }
}