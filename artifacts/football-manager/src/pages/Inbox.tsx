import { useListInboxMessages, useMarkMessageRead, getListInboxMessagesQueryKey, getGetGameStateQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

export default function Inbox() {
  const { data: messages, isLoading } = useListInboxMessages();
  const markRead = useMarkMessageRead();
  const queryClient = useQueryClient();

  const handleRead = (id: number, isRead: boolean) => {
    if (isRead) return;
    markRead.mutate({ data: { id } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInboxMessagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading inbox...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground mt-2">Board directives, scout reports, and media updates.</p>
      </div>

      <div className="space-y-4">
        {messages?.map((msg) => (
          <Card 
            key={msg.id} 
            className={`cursor-pointer transition-colors ${!msg.isRead ? 'bg-primary/5 border-primary/30' : 'bg-card/50 border-border hover:bg-muted/30'}`}
            onClick={() => handleRead(msg.id, msg.isRead)}
          >
            <CardHeader className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
                    {msg.subject}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-wider">{msg.type} • {msg.date}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-4 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{msg.body}</p>
            </CardContent>
          </Card>
        ))}
        {!messages?.length && (
          <div className="text-center p-12 text-muted-foreground border border-dashed border-border rounded-lg">
            No messages in inbox.
          </div>
        )}
      </div>
    </div>
  );
}
