using System.ComponentModel.DataAnnotations;

namespace WebAssembly.Server.Models;


    public class PersonalSnapshotData
    {   
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = "";
        public string GroupId { get; set; } = "";
        public string MonthKey { get; set; } = "";

        public List<Expense> PersonalExpenses { get; set; } = new();
    }
