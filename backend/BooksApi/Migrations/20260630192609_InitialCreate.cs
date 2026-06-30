using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BooksApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Works",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 240, nullable: false),
                    OriginalTitle = table.Column<string>(type: "TEXT", maxLength: 240, nullable: true),
                    Author = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                    OriginalYear = table.Column<int>(type: "INTEGER", nullable: true),
                    Genre = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    CoverUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Works", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Copies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Format = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Publisher = table.Column<string>(type: "TEXT", maxLength: 180, nullable: true),
                    Edition = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    Isbn = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    PublishedYear = table.Column<int>(type: "INTEGER", nullable: true),
                    Language = table.Column<string>(type: "TEXT", maxLength: 40, nullable: true),
                    PageCount = table.Column<int>(type: "INTEGER", nullable: true),
                    Condition = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    Location = table.Column<string>(type: "TEXT", maxLength: 180, nullable: true),
                    AcquisitionDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    AcquisitionType = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    PricePaid = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 8, nullable: false),
                    IsGift = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsSigned = table.Column<bool>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Copies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Copies_Works_WorkId",
                        column: x => x.WorkId,
                        principalTable: "Works",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Readings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    StartedAt = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    FinishedAt = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    Rating = table.Column<int>(type: "INTEGER", nullable: true),
                    Review = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    IsFavorite = table.Column<bool>(type: "INTEGER", nullable: false),
                    WantToReRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Readings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Readings_Works_WorkId",
                        column: x => x.WorkId,
                        principalTable: "Works",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Copies_WorkId",
                table: "Copies",
                column: "WorkId");

            migrationBuilder.CreateIndex(
                name: "IX_Readings_WorkId",
                table: "Readings",
                column: "WorkId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Copies");

            migrationBuilder.DropTable(
                name: "Readings");

            migrationBuilder.DropTable(
                name: "Works");
        }
    }
}
