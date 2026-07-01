public class Reading
{
    public Guid Id { get; set; }
    public Guid WorkId { get; set; }
    public Work? Work { get; set; }
    public ReadingStatus Status { get; set; }
    public DateOnly? StartedAt { get; set; }
    public DateOnly? FinishedAt { get; set; }
    public int? Rating { get; set; }
    public string? Review { get; set; }
    public string? Notes { get; set; }
    public bool IsFavorite { get; set; }
    public bool WantToReRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
