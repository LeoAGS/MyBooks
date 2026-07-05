using Microsoft.EntityFrameworkCore;

public static class MigrationBootstrapper
{
    public static async Task RemoveLegacyLoanColumnsAsync(BooksDbContext db)
    {
        if (!await ColumnExistsAsync(db, "Copies", "IsLoaned"))
        {
            return;
        }

        var volumeCountExpression = await ColumnExistsAsync(db, "Copies", "VolumeCount")
            ? "\"VolumeCount\""
            : "1";
        var editorialCollectionExpression = await ColumnExistsAsync(db, "Copies", "EditorialCollection")
            ? "\"EditorialCollection\""
            : "NULL";

        var rebuildSql = """
            PRAGMA foreign_keys = OFF;

            CREATE TABLE "Copies_new" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Copies" PRIMARY KEY,
                "WorkId" TEXT NOT NULL,
                "Format" TEXT NOT NULL,
                "Publisher" TEXT NULL,
                "EditorialCollection" TEXT NULL,
                "Edition" TEXT NULL,
                "Isbn" TEXT NULL,
                "PublishedYear" INTEGER NULL,
                "Language" TEXT NULL,
                "PageCount" INTEGER NULL,
                "VolumeCount" INTEGER NOT NULL DEFAULT 1,
                "Condition" TEXT NULL,
                "Location" TEXT NULL,
                "AcquisitionDate" TEXT NULL,
                "AcquisitionType" TEXT NOT NULL,
                "PricePaid" TEXT NULL,
                "Currency" TEXT NOT NULL,
                "IsGift" INTEGER NOT NULL,
                "IsSigned" INTEGER NOT NULL,
                "Notes" TEXT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL,
                CONSTRAINT "FK_Copies_Works_WorkId" FOREIGN KEY ("WorkId") REFERENCES "Works" ("Id") ON DELETE CASCADE
            );

            INSERT INTO "Copies_new" (
                "Id",
                "WorkId",
                "Format",
                "Publisher",
                "EditorialCollection",
                "Edition",
                "Isbn",
                "PublishedYear",
                "Language",
                "PageCount",
                "VolumeCount",
                "Condition",
                "Location",
                "AcquisitionDate",
                "AcquisitionType",
                "PricePaid",
                "Currency",
                "IsGift",
                "IsSigned",
                "Notes",
                "CreatedAt",
                "UpdatedAt"
            )
            SELECT
                "Id",
                "WorkId",
                "Format",
                "Publisher",
                __EDITORIAL_COLLECTION_EXPRESSION__,
                "Edition",
                "Isbn",
                "PublishedYear",
                "Language",
                "PageCount",
                __VOLUME_COUNT_EXPRESSION__,
                "Condition",
                "Location",
                "AcquisitionDate",
                "AcquisitionType",
                "PricePaid",
                "Currency",
                "IsGift",
                "IsSigned",
                "Notes",
                "CreatedAt",
                "UpdatedAt"
            FROM "Copies";

            DROP TABLE "Copies";
            ALTER TABLE "Copies_new" RENAME TO "Copies";
            CREATE INDEX "IX_Copies_WorkId" ON "Copies" ("WorkId");

            PRAGMA foreign_keys = ON;
            """
            .Replace("__VOLUME_COUNT_EXPRESSION__", volumeCountExpression, StringComparison.Ordinal)
            .Replace("__EDITORIAL_COLLECTION_EXPRESSION__", editorialCollectionExpression, StringComparison.Ordinal);

        await db.Database.ExecuteSqlRawAsync(rebuildSql);
    }

    public static async Task EnsureCopyVolumeCountColumnAsync(BooksDbContext db)
    {
        if (!await TableExistsAsync(db, "Copies") || await ColumnExistsAsync(db, "Copies", "VolumeCount"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Copies"
            ADD COLUMN "VolumeCount" INTEGER NOT NULL DEFAULT 1;
            """);
    }

    public static async Task EnsureCatalogOrganizationColumnsAsync(BooksDbContext db)
    {
        await EnsureNullableTextColumnAsync(db, "Works", "Category");
        await CopyLegacyLiteratureToCategoryAsync(db);
        await EnsureNullableTextColumnAsync(db, "Works", "CollectionName");
        await EnsureNullableTextColumnAsync(db, "Works", "CollectionNumber");
        await EnsureNullableTextColumnAsync(db, "Copies", "EditorialCollection");
        await EnsureNullableTextColumnAsync(db, "Copies", "CopyTitle");
    }

    public static async Task EnsureCopyWorksTableAsync(BooksDbContext db)
    {
        if (!await TableExistsAsync(db, "Copies") || !await TableExistsAsync(db, "Works"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "CopyWorks" (
                "CopyId" TEXT NOT NULL,
                "WorkId" TEXT NOT NULL,
                "SortOrder" INTEGER NOT NULL DEFAULT 0,
                "Notes" TEXT NULL,
                CONSTRAINT "PK_CopyWorks" PRIMARY KEY ("CopyId", "WorkId"),
                CONSTRAINT "FK_CopyWorks_Copies_CopyId" FOREIGN KEY ("CopyId") REFERENCES "Copies" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_CopyWorks_Works_WorkId" FOREIGN KEY ("WorkId") REFERENCES "Works" ("Id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_CopyWorks_WorkId" ON "CopyWorks" ("WorkId");

            INSERT OR IGNORE INTO "CopyWorks" ("CopyId", "WorkId", "SortOrder", "Notes")
            SELECT "Id", "WorkId", 0, NULL
            FROM "Copies"
            WHERE "WorkId" IS NOT NULL;
            """);
    }

    public static async Task RemoveLegacyLiteratureColumnAsync(BooksDbContext db)
    {
        if (!await TableExistsAsync(db, "Works") || !await ColumnExistsAsync(db, "Works", "Literature"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            PRAGMA foreign_keys = OFF;

            CREATE TABLE "Works_new" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Works" PRIMARY KEY,
                "Title" TEXT NOT NULL,
                "OriginalTitle" TEXT NULL,
                "Author" TEXT NOT NULL,
                "OriginalYear" INTEGER NULL,
                "Genre" TEXT NULL,
                "Category" TEXT NULL,
                "CollectionName" TEXT NULL,
                "CollectionNumber" TEXT NULL,
                "Description" TEXT NULL,
                "CoverUrl" TEXT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL
            );

            INSERT INTO "Works_new" (
                "Id",
                "Title",
                "OriginalTitle",
                "Author",
                "OriginalYear",
                "Genre",
                "Category",
                "CollectionName",
                "CollectionNumber",
                "Description",
                "CoverUrl",
                "CreatedAt",
                "UpdatedAt"
            )
            SELECT
                "Id",
                "Title",
                "OriginalTitle",
                "Author",
                "OriginalYear",
                "Genre",
                "Category",
                "CollectionName",
                "CollectionNumber",
                "Description",
                "CoverUrl",
                "CreatedAt",
                "UpdatedAt"
            FROM "Works";

            DROP TABLE "Works";
            ALTER TABLE "Works_new" RENAME TO "Works";

            PRAGMA foreign_keys = ON;
            """);
    }

    public static async Task MarkConsolidatedSchemaMigrationIfAlreadyAppliedAsync(BooksDbContext db)
    {
        var migrationId = db.Database.GetMigrations()
            .FirstOrDefault(migration => migration.EndsWith("_ConsolidateCopyWorksSchema", StringComparison.Ordinal));

        if (migrationId is null || await MigrationHistoryContainsAsync(db, migrationId))
        {
            return;
        }

        if (!await TableExistsAsync(db, "CopyWorks") || !await ColumnExistsAsync(db, "Copies", "CopyTitle"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ({0}, {1});
            """,
            migrationId,
            "8.0.21");
    }

    private static async Task CopyLegacyLiteratureToCategoryAsync(BooksDbContext db)
    {
        if (!await TableExistsAsync(db, "Works") ||
            !await ColumnExistsAsync(db, "Works", "Category") ||
            !await ColumnExistsAsync(db, "Works", "Literature"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            UPDATE "Works"
            SET "Category" = "Literature"
            WHERE ("Category" IS NULL OR "Category" = '')
              AND "Literature" IS NOT NULL
              AND "Literature" <> '';
            """);
    }

    private static async Task EnsureNullableTextColumnAsync(BooksDbContext db, string tableName, string columnName)
    {
        if (!await TableExistsAsync(db, tableName) || await ColumnExistsAsync(db, tableName, columnName))
        {
            return;
        }

        var alterSql = """
            ALTER TABLE "__TABLE_NAME__"
            ADD COLUMN "__COLUMN_NAME__" TEXT NULL;
            """
            .Replace("__TABLE_NAME__", tableName, StringComparison.Ordinal)
            .Replace("__COLUMN_NAME__", columnName, StringComparison.Ordinal);

        await db.Database.ExecuteSqlRawAsync(alterSql);
    }

    public static async Task MarkLegacyDatabaseAsMigratedAsync(BooksDbContext db)
    {
        if (!await TableExistsAsync(db, "Works"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                "ProductVersion" TEXT NOT NULL
            );
            """);

        if (await MigrationHistoryHasRowsAsync(db))
        {
            return;
        }

        var initialMigration = db.Database.GetMigrations().FirstOrDefault();
        if (initialMigration is null)
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ({0}, {1});
            """,
            initialMigration,
            "8.0.21");
    }

    private static async Task<bool> TableExistsAsync(BooksDbContext db, string tableName)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM sqlite_master
            WHERE type = 'table' AND name = $tableName;
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$tableName";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    private static async Task<bool> ColumnExistsAsync(BooksDbContext db, string tableName, string columnName)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = $"""
            SELECT COUNT(*)
            FROM pragma_table_info('{tableName}')
            WHERE name = $columnName;
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$columnName";
        parameter.Value = columnName;
        command.Parameters.Add(parameter);

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    private static async Task<bool> MigrationHistoryContainsAsync(BooksDbContext db, string migrationId)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM "__EFMigrationsHistory"
            WHERE "MigrationId" = $migrationId;
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$migrationId";
        parameter.Value = migrationId;
        command.Parameters.Add(parameter);

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    private static async Task<bool> MigrationHistoryHasRowsAsync(BooksDbContext db)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM "__EFMigrationsHistory";
            """;

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }
}
