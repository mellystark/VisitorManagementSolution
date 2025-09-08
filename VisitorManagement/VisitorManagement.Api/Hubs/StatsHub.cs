using Microsoft.AspNetCore.SignalR;

namespace VisitorManagement.Api.Hubs
{
    public class StatsHub : Hub
    {
        public async Task SendStatsUpdate(object stats)
        {
            await Clients.All.SendAsync("ReceiveStatsUpdate", stats);
        }
    }
}
