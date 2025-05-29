namespace WebAssembly.Server.Models
{
    public class MonthlyOverview
    {
        public int Id { get; set; } // ✅ Primärschlüssel (wird automatisch erkannt und verwaltet)

        public int MonthId { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }

        public bool User1Confirmed { get; set; }
        public bool User2Confirmed { get; set; }

        public decimal Total { get; set; }
        public decimal Shared { get; set; }
        public decimal SharedUser1 { get; set; }
        public decimal SharedUser2 { get; set; }

        public decimal Child { get; set; }
        public decimal ChildUser1 { get; set; }
        public decimal ChildUser2 { get; set; }

        public decimal Balance { get; set; }

        public List<ClarificationReactions> ClarificationReactionsList { get; set; }
    }
}