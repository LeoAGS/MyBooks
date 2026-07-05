using Microsoft.EntityFrameworkCore;

public static class CatalogQueries
{
    public static IQueryable<Work> LoadWorks(BooksDbContext db) =>
        db.Works
            .AsSplitQuery()
            .Include(work => work.Readings)
            .Include(work => work.Copies)
                .ThenInclude(copy => copy.ContainedWorks)
                    .ThenInclude(link => link.Work)
            .Include(work => work.ContainedInCopies)
                .ThenInclude(link => link.Copy)
                    .ThenInclude(copy => copy!.ContainedWorks)
                        .ThenInclude(link => link.Work);
}
