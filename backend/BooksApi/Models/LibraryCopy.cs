public class LibraryCopy
{
    public Guid Id { get; set; }
    public Guid WorkId { get; set; }
    public Work? Work { get; set; }
    public string? CopyTitle { get; set; }
    public string? CoverUrl { get; set; }
    public CopyFormat Format { get; set; }
    public string? Publisher { get; set; }
    public string? EditorialCollection { get; set; }
    public string? Edition { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
    public string? Language { get; set; }
    public int? PageCount { get; set; }
    public int VolumeCount { get; set; } = 1;
    public string? Condition { get; set; }
    public string? Location { get; set; }
    public DateOnly? AcquisitionDate { get; set; }
    public AcquisitionType AcquisitionType { get; set; }
    public decimal? PricePaid { get; set; }
    public string Currency { get; set; } = "BRL";
    public bool IsGift { get; set; }
    public bool IsSigned { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<CopyWork> ContainedWorks { get; set; } = [];
}
