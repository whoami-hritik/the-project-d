namespace monster_world.Models.Dto
{
    public class UserBaseDto
    {
        public long ID { get; set; }
        public int Role { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string LanguageCode { get; set; }
        public bool AllowsWriteToPm { get; set; }
        public string PhotoUrl { get; set; }
        public double TON { get; set; }
        public double GOLD { get; set; }
        public double CRYSTAL { get; set; }
        public bool Bonus { get; set; }
        public long TotalVictory { get; set; }
        public int TotalBattles { get; set; }
        public int TotalCaptured { get; set; }
        public bool Tutorial { get; set; }
        public int Level { get; set; }
        public DateTime RegistrationDate { get; set; }
    }
    
}