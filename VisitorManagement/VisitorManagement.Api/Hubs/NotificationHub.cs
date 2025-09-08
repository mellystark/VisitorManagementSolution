using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace VisitorManagement.Api.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task SendNotification(string type, string message, object log = null)
        {
            await Clients.All.SendAsync("ReceiveNotification", new
            {
                Type = type,       // "EntryCreated", "ExitUpdate" gibi
                Message = message, // bildirim metni
                Log = log          // log objesi (null olabilir)
            });
        }
    }
}
