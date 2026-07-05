public class CopyWork
{
    public Guid CopyId { get; set; }
    public LibraryCopy? Copy { get; set; }
    public Guid WorkId { get; set; }
    public Work? Work { get; set; }
    public int SortOrder { get; set; }
    public string? Notes { get; set; }
}
