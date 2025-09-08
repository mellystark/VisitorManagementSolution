using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace VisitorManagement.Api.Hubs
{
    public class VisitorHub : Hub
    {
        // Gerekirse spesifik metodlar ekleyebilirsin
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
