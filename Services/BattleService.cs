using System.ComponentModel.DataAnnotations;
using System.Net.Http.Headers;
using monster_world.Models;

namespace monster_world.Services
{
    public class BattleState
    {
        [Key]
        public Guid BattleId { get; set; }
        public long PlayerId { get; set; }
        public Monster PlayerMonster { get; set; }
        public Monster EnemyMonster { get; set; }
        public MonsterState PlayerState { get; set; }
        public MonsterState EnemyState { get; set; }
        public BattleStatus Status { get; set; }
        public DateTime StartedAt { get; set; }
        public int TurnCount { get; set; }
        public List<string> PlayerActiveSkills { get; set; } = new();
        public List<string> EnemyActiveSkills { get; set; } = new();
        public string? PlayerLastEffect { get; set; } = null;
        public string? EnemyLastEffect { get; set; } = null;
        public string? PlayerCooldownSkill { get; set; } = null;
        public string? EnemyCooldownSkill { get; set; } = null;

        public bool Victory { get; set; } = false;

        
    }

    public class BattleService
    {
        private readonly GameplayService _gameplayService;
        public BattleService(GameplayService monsterService)
        {
            _gameplayService = monsterService;
        }

        // Type advantage chart: [skillKind][defenderKind] → strong (1.2) or weak (0.8)
        // Unlisted combinations → normal (1.0)
        private static readonly Dictionary<string, HashSet<string>> _strongAgainst =
            new(StringComparer.OrdinalIgnoreCase)
            {
                { "fire",     new(StringComparer.OrdinalIgnoreCase) { "desert", "dark" } },
                { "water",    new(StringComparer.OrdinalIgnoreCase) { "fire", "desert", "earth" } },
                { "electric", new(StringComparer.OrdinalIgnoreCase) { "water", "dark" } },
                { "earth",    new(StringComparer.OrdinalIgnoreCase) { "electric", "fire" } },
                { "desert",   new(StringComparer.OrdinalIgnoreCase) { "fire", "electric" } },
                { "dark",     new(StringComparer.OrdinalIgnoreCase) { "electric" } },
            };

        private static readonly Dictionary<string, HashSet<string>> _weakAgainst =
            new(StringComparer.OrdinalIgnoreCase)
            {
                { "fire",     new(StringComparer.OrdinalIgnoreCase) { "water", "earth" } },
                { "water",    new(StringComparer.OrdinalIgnoreCase) { "electric" } },
                { "electric", new(StringComparer.OrdinalIgnoreCase) { "earth", "desert" } },
                { "earth",    new(StringComparer.OrdinalIgnoreCase) { "water", "desert" } },
                { "desert",   new(StringComparer.OrdinalIgnoreCase) { "water" } },
                { "dark",     new(StringComparer.OrdinalIgnoreCase) { "fire" } },
            };


        public BattleState CreateBattle(Monster playerMonster, Monster enemyMonster)
        {
            BattleState battle = new()
            {
                PlayerMonster = playerMonster,
                EnemyMonster = enemyMonster,
                PlayerState = new MonsterState()
                {
                    Rage = false,
                    Hypno = false,
                    Sick = false,
                    JustMissed = false,
                    AtkBonus = 0,
                    DefBonus = 0,
                    PendingHeal = 0                    
                },
                EnemyState = new MonsterState(),
                Status = BattleStatus.Active,
                TurnCount = 0,
                PlayerActiveSkills = new List<string>(),
                EnemyActiveSkills = new List<string>(),
                PlayerLastEffect = null,
                EnemyLastEffect = null
            };
            return battle;
        }

        public List<string> GetActiveSkills(Monster Monster)
        {
            var def = _gameplayService.GetMonsterDef(Monster.Id);
            var skills = def.Abilities
                .Where(a => a.GetsAt <= Monster.Level)
                .Select(a => a.Id)
                .ToList();

            if (!skills.Any()) return new List<string>();

            Random rnd = new Random();
            var active = new List<string>();

            while (active.Count < Math.Min(3, skills.Count))
            {
                var idx = rnd.Next(skills.Count);
                var skillId = skills[idx];
                if (!active.Contains(skillId))
                {
                    active.Add(skillId + "-" + rnd.Next(10000));
                }
            }
            return active;
        }

        public string PickSkill(Monster Monster)
        {
            var def = _gameplayService.GetMonsterDef(Monster.Id);
            var skills = def.Abilities
                .Where(a => a.GetsAt <= Monster.Level)
                .Select(a => a.Id)
                .ToList();

            if (!skills.Any()) return null;

            return skills[new Random().Next(skills.Count)];
        }

    
       public class AttackResults
        {
            public AttackResult PlayerAttack { get; set; }
            public AttackResult EnemyAttack { get; set; }
        }

        public AttackResult PlayerAttack(
            ref BattleState battle,
            string skillId,
            ref MonsterState attackerState, 
            ref MonsterState defenderState )
        {
            string lastSkillId = skillId.Split("-")[0];
            SkillDef lastSkill = _gameplayService.GetSkillDef(lastSkillId);
            var newSkillId = PickSkill(battle.PlayerMonster);
            if (newSkillId == null) return AttackResult.NoEffect();

            SkillDef newSkill = _gameplayService.GetSkillDef(newSkillId);
            newSkillId = newSkill.Id + "-" + Random.Shared.Next(00000, 99999);

            if (lastSkill.Cooldown > 0)
            {
                if (newSkill.Cooldown > 0 && lastSkill.Id == newSkill.Id)
                {
                    battle.PlayerCooldownSkill = newSkillId;
                }
            }
            else
            {
                battle.PlayerCooldownSkill = null;
            }

            int index = battle.PlayerActiveSkills.IndexOf(skillId);

            if (index != -1)
            {
                battle.PlayerActiveSkills[index] = newSkillId;
            }
    
            AttackResult attackRes = ResolveAttack(battle.PlayerMonster, battle.EnemyMonster, lastSkill, attackerState, defenderState, lastSkill);
            battle.PlayerLastEffect = lastSkillId;

            // FIX 3: track JustMissed for mercy mechanic next turn
            attackerState.JustMissed = attackRes.Missed;

            if (attackRes.Missed)
            {
                // no HP change on miss
            }
            else if (attackRes.Backfired)
            {
                battle.PlayerMonster.CurrentHP -= attackRes.Damage;
            }
            else
            {
                battle.EnemyMonster.CurrentHP -= attackRes.Damage;
                // FIX 4: apply SICK damage to defender each turn
                if (defenderState.Sick)
                    battle.EnemyMonster.CurrentHP -= _gameplayService.GetBattleData().SickDamage;
            }

            // Apply pending heal to attacker (from skills like enflame, revive)
            battle.PlayerMonster.CurrentHP += attackerState.PendingHeal;
            attackerState.PendingHeal = 0; // reset after applying
            return attackRes;

        }

        public AttackResult EnemyAttack(
            ref BattleState battle,
            ref MonsterState attackerState, 
            ref MonsterState defenderState )
        {
            Random rnd = new Random();

            string skillId = null;

            while(skillId == null && battle.EnemyActiveSkills.Any())
            {
                int idx = rnd.Next(battle.EnemyActiveSkills.Count);
                if (battle.EnemyActiveSkills[idx] != battle.EnemyCooldownSkill)
                {
                    skillId = battle.EnemyActiveSkills[idx];
                }
            }

            if (skillId == null) return AttackResult.NoEffect();

            string lastSkillId = skillId.Split("-")[0];
            SkillDef lastSkill = _gameplayService.GetSkillDef(lastSkillId);

            var newSkillId = PickSkill(battle.EnemyMonster);
            if (newSkillId == null) return AttackResult.NoEffect();

            SkillDef newSkill = _gameplayService.GetSkillDef(newSkillId);
            newSkillId = newSkill.Id + "-" + Random.Shared.Next(00000, 99999);

            if (lastSkill.Cooldown > 0)
            {
                if (newSkill.Cooldown > 0 && lastSkill.Id == newSkill.Id)
                {
                    battle.EnemyCooldownSkill = newSkillId;
                }
            }
            else
            {
                battle.EnemyCooldownSkill = null;
            }

            int index = battle.EnemyActiveSkills.IndexOf(skillId);

            if (index != -1)
            {
                battle.EnemyActiveSkills[index] = newSkillId;
            }

            AttackResult attackRes = ResolveAttack(battle.EnemyMonster, battle.PlayerMonster, lastSkill, attackerState, defenderState, lastSkill);
            battle.EnemyLastEffect = lastSkillId;

            // FIX 3: track JustMissed for mercy mechanic next turn
            attackerState.JustMissed = attackRes.Missed;

            if (attackRes.Missed)
            {
                // no HP change on miss
            }
            else if (attackRes.Backfired)
            {
                battle.EnemyMonster.CurrentHP -= attackRes.Damage;
            }
            else
            {
                battle.PlayerMonster.CurrentHP -= attackRes.Damage;
                // FIX 4: apply SICK damage to defender each turn
                if (defenderState.Sick)
                    battle.PlayerMonster.CurrentHP -= _gameplayService.GetBattleData().SickDamage;
            }

            // FIX 5: enemy heals ITSELF (attackerState), not the player (defenderState)
            battle.EnemyMonster.CurrentHP += attackerState.PendingHeal;
            attackerState.PendingHeal = 0; // reset after applying

            return attackRes;
        }

        public bool CatchMonster(Monster Opponent)
        {
            int level = Opponent.Level;
            CatchOddsRange captureTable = _gameplayService.GetCatchOddsRange(level);
            if (captureTable == null || captureTable.Data == null || !captureTable.Data.Any())
                return false;

            float hpPct = (float)Opponent.CurrentHP / 100f;
            CatchOddsLvlData oddTable = captureTable.Data
                .OrderByDescending(o => o.At)
                .FirstOrDefault(o => hpPct >= o.At) ?? captureTable.Data.OrderBy(o => o.At).First();

            Random rnd = new();
            bool Captured = rnd.NextDouble() <= oddTable.Odds;
            return Captured;
        }

    


        



























        // ─── 1. Get live stats for a monster at its current level ────────────
        public LevelStat GetStats(Monster monster)
        {
            if (monster == null)
                throw new ArgumentNullException(nameof(monster), "Monster cannot be null.");

            var def = _gameplayService.GetMonsterDef(monster.Id);
            if (def == null)
                throw new InvalidOperationException($"Monster definition not found for ID: {monster.Id}");

            var table = _gameplayService.GetLevelTable(def.LvlTableId);
            if (table == null || table.LvlTable == null)
                throw new InvalidOperationException($"Level table not found for LvlTableId: {def.LvlTableId}");

            var stat = table.LvlTable.FirstOrDefault(s => s.Lvl == monster.Level);
            if (stat == null)
                throw new InvalidOperationException($"No stats found for monster level: {monster.Level}");

            return stat;
        }

        // ─── 2. Get skills available to a monster at its current level ───────
        // public List<SkillDef> GetUnlockedSkills(Monster monster)
        // {
        //     var def = _monsterDefs.First(d => d.Id == monster.DefId);
        //     var unlockedIds = def.Abilities
        //         .Where(a => a.GetsAt <= monster.Level)
        //         .Select(a => a.Id)
        //         .Distinct();                    // multiple getsAt entries for same skill = just once
        //     return _skillDefs.Where(s => unlockedIds.Contains(s.Id)).ToList();
        // }

        // // ─── 3. Pick opponent's skill (AI) ───────────────────────────────────
        // public SkillDef PickOpponentSkill(Monster opponent, List<string> cooldowns)
        // {
        //     var available = GetUnlockedSkills(opponent)
        //         .Where(s => !cooldowns.Contains(s.Id))  // skip skills on cooldown
        //         .ToList();
        //     return available[new Random().Next(available.Count)];
        // }

        // ─── 4. Resolve a single attack ──────────────────────────────────────
        public AttackResult ResolveAttack(
            Monster attacker,
            Monster defender,
            SkillDef skill,
            MonsterState attackerState,      // rage, hypno, sick flags
            MonsterState defenderState,
            SkillDef lastSkill)
        {
            if (attacker == null)
                throw new ArgumentNullException(nameof(attacker), "Attacker cannot be null.");

            if (defender == null)
                throw new ArgumentNullException(nameof(defender), "Defender cannot be null.");

            var bd      = _gameplayService.GetBattleData();
            var atkStat = GetStats(attacker);
            var defStat = GetStats(defender);
            var defDef  = _gameplayService.GetMonsterDef(defender.Id);

            // FIX 1+2: Compute effective stats — base + in-battle bonuses from skills
            int effectiveAtk = atkStat.Atk + attackerState.AtkBonus;
            int effectiveDef = defStat.Def  + defenderState.DefBonus;
            // FIX 2: AimBonus applied here, JustMissed mercy bonus also included
            int rawAim       = atkStat.Aim  + attackerState.AimBonus;
            if (attackerState.JustMissed) rawAim += bd.MissReduceAfterMiss;
            int effectiveAim = Math.Min(100, rawAim);

            // Shared aim bracket — reused for both miss and crit to avoid double lookup
            var aimBracket = bd.Aiming.First(a => a.UpTo >= effectiveAim);

            // --- STEP 1: Miss check ---
            if (!skill.NoMiss)
            {
                var (missN, missD) = ParseRatio(aimBracket.Miss);  // "17:100"
                if (RollChance(missN, missD))
                    return AttackResult.Miss();
            }
            ApplyEffects(lastSkill, ref attackerState, ref defenderState);
            
            // --- STEP 2: Backfire check (if attacker is hypno'd) ---
            if (attackerState.Hypno && !skill.NoBackfire)
            {
                var (bfN, bfD) = ParseRatio(bd.HypnoBackfireChance); // "1:2"
                if (RollChance(bfN, bfD))
                {
                    int backfireDmg = (int)(skill.Effects.Attack.GetValueOrDefault() * bd.BackfireDamageFactor);
                    return AttackResult.Backfire(Math.Max(1, backfireDmg));
                }
            }

            // --- STEP 3: Compute base damage ---
            if (skill.Effects.Attack.HasValue)
            {
                int skillPower = skill.Effects.Attack.Value;

                // FIX: use a stable RPG ratio formula instead of broken quadratic subtraction.
                // Power * (Atk / Def) keeps damage proportional to skill power and scales beautifully across all levels
                if (effectiveDef <= 0) effectiveDef = 1;
                float base_     = skillPower * ((float)effectiveAtk / effectiveDef);
                float damage    = MathF.Max(1f, base_);

                // --- STEP 4: Type advantage (skill kind vs defender monster kind) ---
                // FIX 6: GetKindFactor now uses real type chart
                float kindFactor = GetKindFactor(skill.Kind, defDef.Kind);
                damage *= kindFactor;

                // --- STEP 5: Rage ---
                if (attackerState.Rage)
                    damage *= bd.RageFactor;

                // --- STEP 6: Extra damage condition ---
                if (skill.ExtraWhen == "self_hurt" && attacker.CurrentHP <= 100 * bd.ExtraByHurtThreshold)
                    damage *= bd.ExtraDamageFactor;
                if (skill.ExtraWhen == "sick" && defenderState.Sick)
                    damage *= bd.ExtraDamageFactor;

                // --- STEP 7: Crit — FIX 2: reuse same aimBracket (effectiveAim already computed)
                bool isCrit = false;
                var (critN, critD) = ParseRatio(aimBracket.Crit);
                if (RollChance(critN, critD)) { damage *= bd.CritFactor; isCrit = true; }

                // --- STEP 8: Multi-hit (quick_attack style) ---
                if (skill.RandomHits != null)
                {
                    var parts = skill.RandomHits.Split('-');
                    int hits  = new Random().Next(int.Parse(parts[0]), int.Parse(parts[1]) + 1);
                    damage   *= hits;
                }

                return AttackResult.Hit((int)damage, isCrit, kindFactor);
            }

            return AttackResult.NoEffect();
        }

        // ─── 5. Apply all side effects (stat mods + status) ──────────────────
        public void ApplyEffects(SkillDef skill, ref MonsterState attackerState, ref MonsterState defenderState)
        {
            var fx = skill.Effects;

            // Status effects (probabilistic)
            if (fx.StateSick  != null) { var (n,d) = ParseRatio(fx.StateSick);  if (RollChance(n,d)) defenderState.Sick  = true; }
            if (fx.StateHypno != null) { var (n,d) = ParseRatio(fx.StateHypno); if (RollChance(n,d)) defenderState.Hypno = true; }
            if (fx.StateRage  != null) { var (n,d) = ParseRatio(fx.StateRage);  if (RollChance(n,d)) attackerState.Rage  = true; }

            // Stat changes (applied to attacker)
            if (fx.IncrAtk.HasValue) attackerState.AtkBonus += fx.IncrAtk.Value;
            if (fx.DecrAtk.HasValue) defenderState.AtkBonus -= fx.DecrAtk.Value;
            if (fx.IncrDef.HasValue) attackerState.DefBonus += fx.IncrDef.Value;
            if (fx.DecrDef.HasValue) defenderState.DefBonus -= fx.DecrDef.Value;
            if (fx.IncrAim.HasValue) attackerState.AimBonus += fx.IncrAim.Value;
            if (fx.DecrAim.HasValue) defenderState.AimBonus -= fx.DecrAim.Value;

            
            // Heal
            if (fx.HealPercent != null)
            {
                var (min, max) = ParseRange(fx.HealPercent); // "15-25"
                int pct  = new Random().Next(min, max + 1);
                int heal = (int)(100 * pct / 100f);          // maxHP=100
                attackerState.PendingHeal = heal;
            }
        }

        // ─── 6. XP reward after battle ────────────────────────────────────────
        public int CalculateXpReward(int playerLevel, int opponentLevel)
        {
            int delta = opponentLevel - playerLevel;
            var entry = _gameplayService.GetBattleData().XpData
                .Where(x => x.Delta <= delta)
                .OrderByDescending(x => x.Delta)
                .FirstOrDefault();
            return entry?.Xp ?? 5; // fallback minimum
        }

        // ─── Helpers ──────────────────────────────────────────────────────────
        // FIX 6: Real type chart — uses static dicts defined at top of class
        private float GetKindFactor(string skillKind, string defenderKind)
        {
            var kf = _gameplayService.GetBattleData().KindFactors;

            if (string.IsNullOrEmpty(skillKind) || skillKind == "none")
                return kf.Normal;

            if (_strongAgainst.TryGetValue(skillKind, out var strong) && strong.Contains(defenderKind))
                return kf.Strong; // 1.2

            if (_weakAgainst.TryGetValue(skillKind, out var weak) && weak.Contains(defenderKind))
                return kf.Weak;   // 0.8

            return kf.Normal;     // 1.0
        }

        private static (int, int) ParseRatio(string value)
        {
            var p = value.Split(':');
            return (int.Parse(p[0]), int.Parse(p[1]));
        }

        private static (int, int) ParseRange(string value)
        {
            var p = value.Split('-');
            return (int.Parse(p[0]), int.Parse(p[1]));
        }

        private static bool RollChance(int n, int d)
            => new Random().Next(1, d + 1) <= n;
    }

    // ─── Supporting types ─────────────────────────────────────────────────────
    public class MonsterState
    {
        public bool   Rage       { get; set; }
        public bool   Sick       { get; set; }
        public bool   Hypno      { get; set; }
        public bool   JustMissed { get; set; }
        public int    AtkBonus   { get; set; }
        public int    DefBonus   { get; set; }
        public int    AimBonus   { get; set; }
        public int    PendingHeal{ get; set; }

        public MonsterState()
        {
            Rage = false;
            Sick = false;
            Hypno = false;
            JustMissed = false;
            AtkBonus = 0;
            DefBonus = 0;
            AimBonus = 0;
            PendingHeal = 0;
        }
    }

    public class AttackResult
    {
        public bool   Missed     { get; set; }
        public bool   Backfired  { get; set; }
        public bool   IsCrit     { get; set; }
        public int    Damage     { get; set; }
        public float  KindFactor { get; set; }  // 1.2, 0.8 or 1.0 — for "SUPER EFFECTIVE" UI

        public static AttackResult Miss()                      => new() { Missed = true };
        public static AttackResult Backfire(int dmg)          => new() { Backfired = true, Damage = dmg };
        public static AttackResult Hit(int dmg, bool crit, float kf) => new() { Damage = dmg, IsCrit = crit, KindFactor = kf };
        public static AttackResult NoEffect()                 => new();
    }
}
