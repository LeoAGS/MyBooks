using Microsoft.EntityFrameworkCore;

public static class SeedData
{
    public static async Task EnsureSeededAsync(BooksDbContext db)
    {
        if (await db.Works.AnyAsync())
        {
            return;
        }

        var domCasmurroId = Guid.Parse("3a35f6c1-0a5d-4f86-9cb7-9fd5a4c8a601");
        var hobbitId = Guid.Parse("7dc01418-f330-42ab-bbd1-e01e98364451");
        var duneId = Guid.Parse("b897a56c-96f9-4c5e-9d0f-42d496bf0e5b");
        var now = DateTimeOffset.UtcNow;

        db.Works.AddRange(
            new Work
            {
                Id = domCasmurroId,
                Title = "Dom Casmurro",
                Author = "Machado de Assis",
                OriginalYear = 1899,
                Genre = "Romance",
                Description = "Uma obra lida e registrada, mesmo sem exemplar fisico cadastrado.",
                CreatedAt = now,
                UpdatedAt = now,
                Readings =
                [
                    new Reading
                    {
                        Id = Guid.NewGuid(),
                        WorkId = domCasmurroId,
                        Status = ReadingStatus.Read,
                        StartedAt = new DateOnly(2024, 2, 10),
                        FinishedAt = new DateOnly(2024, 2, 24),
                        Rating = 5,
                        Review = "Leitura excelente para revisitar narradores pouco confiaveis.",
                        Notes = "Adicionar citacoes favoritas depois.",
                        IsFavorite = true,
                        WantToReRead = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ]
            },
            new Work
            {
                Id = hobbitId,
                Title = "O Hobbit",
                OriginalTitle = "The Hobbit",
                Author = "J.R.R. Tolkien",
                OriginalYear = 1937,
                Genre = "Fantasia",
                Description = "Exemplo de obra lida que tambem possui exemplar na biblioteca.",
                CreatedAt = now,
                UpdatedAt = now,
                Readings =
                [
                    new Reading
                    {
                        Id = Guid.NewGuid(),
                        WorkId = hobbitId,
                        Status = ReadingStatus.Read,
                        StartedAt = new DateOnly(2023, 7, 1),
                        FinishedAt = new DateOnly(2023, 7, 18),
                        Rating = 5,
                        Review = "Aventura confortavel e muito redonda.",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ],
                Copies =
                [
                    new LibraryCopy
                    {
                        Id = Guid.NewGuid(),
                        WorkId = hobbitId,
                        Format = CopyFormat.Physical,
                        Publisher = "HarperCollins",
                        Edition = "Capa dura",
                        Isbn = "9788595084742",
                        PublishedYear = 2019,
                        Language = "Portugues",
                        Condition = "Muito bom",
                        Location = "Estante sala / Prateleira 2",
                        AcquisitionDate = new DateOnly(2021, 12, 5),
                        AcquisitionType = AcquisitionType.Bought,
                        PricePaid = 49.90m,
                        Currency = "BRL",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ]
            },
            new Work
            {
                Id = duneId,
                Title = "Duna",
                OriginalTitle = "Dune",
                Author = "Frank Herbert",
                OriginalYear = 1965,
                Genre = "Ficcao cientifica",
                Description = "Exemplo de livro presente na biblioteca, mas ainda nao finalizado.",
                CreatedAt = now,
                UpdatedAt = now,
                Readings =
                [
                    new Reading
                    {
                        Id = Guid.NewGuid(),
                        WorkId = duneId,
                        Status = ReadingStatus.WantToRead,
                        Notes = "Comecar depois de terminar a leitura atual.",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ],
                Copies =
                [
                    new LibraryCopy
                    {
                        Id = Guid.NewGuid(),
                        WorkId = duneId,
                        Format = CopyFormat.Physical,
                        Publisher = "Aleph",
                        Edition = "Edicao especial",
                        Isbn = "9788576573135",
                        PublishedYear = 2017,
                        Language = "Portugues",
                        Condition = "Bom",
                        Location = "Estante quarto / Prateleira 1",
                        AcquisitionDate = new DateOnly(2022, 8, 14),
                        AcquisitionType = AcquisitionType.Bought,
                        PricePaid = 69.90m,
                        Currency = "BRL",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ]
            });

        await db.SaveChangesAsync();
    }
}
