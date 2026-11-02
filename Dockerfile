FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY SupportDesk.Api/SupportDesk.Api.csproj SupportDesk.Api/
RUN dotnet restore SupportDesk.Api/SupportDesk.Api.csproj
COPY SupportDesk.Api/ SupportDesk.Api/
RUN dotnet publish SupportDesk.Api/SupportDesk.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet SupportDesk.Api.dll"]