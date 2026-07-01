using Microsoft.EntityFrameworkCore;

public class BooksDbContext(DbContextOptions<BooksDbContext> options) : DbContext(options)
{
    public DbSet<Work> Works => Set<Work>();
    public DbSet<Reading> Readings => Set<Reading>();
    public DbSet<LibraryCopy> Copies => Set<LibraryCopy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Work>(entity =>
        {
            entity.ToTable("Works");
            entity.HasKey(work => work.Id);
            entity.Property(work => work.Title).HasMaxLength(240).IsRequired();
            entity.Property(work => work.OriginalTitle).HasMaxLength(240);
            entity.Property(work => work.Author).HasMaxLength(180).IsRequired();
            entity.Property(work => work.Genre).HasMaxLength(80);
            entity.Property(work => work.CoverUrl).HasMaxLength(500);
            entity.HasMany(work => work.Readings)
                .WithOne(reading => reading.Work)
                .HasForeignKey(reading => reading.WorkId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(work => work.Copies)
                .WithOne(copy => copy.Work)
                .HasForeignKey(copy => copy.WorkId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Reading>(entity =>
        {
            entity.ToTable("Readings");
            entity.HasKey(reading => reading.Id);
            entity.Property(reading => reading.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(reading => reading.Rating);
        });

        modelBuilder.Entity<LibraryCopy>(entity =>
        {
            entity.ToTable("Copies");
            entity.HasKey(copy => copy.Id);
            entity.Property(copy => copy.Format).HasConversion<string>().HasMaxLength(40);
            entity.Property(copy => copy.AcquisitionType).HasConversion<string>().HasMaxLength(40);
            entity.Property(copy => copy.Publisher).HasMaxLength(180);
            entity.Property(copy => copy.Edition).HasMaxLength(120);
            entity.Property(copy => copy.Isbn).HasMaxLength(32);
            entity.Property(copy => copy.Language).HasMaxLength(40);
            entity.Property(copy => copy.Condition).HasMaxLength(80);
            entity.Property(copy => copy.Location).HasMaxLength(180);
            entity.Property(copy => copy.Currency).HasMaxLength(8);
            entity.Property(copy => copy.PricePaid).HasPrecision(10, 2);
        });
    }
}
