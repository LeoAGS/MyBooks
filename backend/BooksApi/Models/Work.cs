public class Work
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? OriginalTitle { get; set; }
    public string Author { get; set; } = "";
    public int? OriginalYear { get; set; }
    public string? Genre { get; set; }
    public string? Category { get; set; }
    public string? CollectionName { get; set; }
    public string? CollectionNumber { get; set; }
    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<Reading> Readings { get; set; } = [];
    public List<LibraryCopy> Copies { get; set; } = [];
    public List<CopyWork> ContainedInCopies { get; set; } = [];
}
