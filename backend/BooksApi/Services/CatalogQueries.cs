using Microsoft.EntityFrameworkCore;

public static class CatalogQueries
{
    public static IQueryable<Work> LoadWorks(BooksDbContext db) =>
        db.Works
            .Include(work => work.Readings)
            .Include(work => work.Copies);
}
