import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Plus, RefreshCw } from "lucide-react";

interface BrokerIntegrationProps {
  userId: string;
}

const BrokerIntegration = ({ userId }: BrokerIntegrationProps) => {
  const { toast } = useToast();
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<"zerodha" | "angel_one">("zerodha");
  const [credentials, setCredentials] = useState({
    apiKey: "",
    apiSecret: "",
  });

  useEffect(() => {
    fetchBrokers();
  }, [userId]);

  const fetchBrokers = async () => {
    const { data, error } = await supabase
      .from("broker_accounts")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      setBrokers(data);
    }
    setLoading(false);
  };

  const handleAddBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("broker_accounts")
        .insert({
          user_id: userId,
          broker_type: selectedBroker,
          api_key_encrypted: credentials.apiKey,
          api_secret_encrypted: credentials.apiSecret,
          is_active: true,
          last_connected_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Broker Connected",
        description: `${selectedBroker === "zerodha" ? "Zerodha" : "Angel One"} has been connected successfully.`,
      });

      setCredentials({ apiKey: "", apiSecret: "" });
      setShowAddForm(false);
      fetchBrokers();
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect broker.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (brokerId: string) => {
    try {
      const { error } = await supabase
        .from("broker_accounts")
        .update({ is_active: false })
        .eq("id", brokerId);

      if (error) throw error;

      toast({
        title: "Broker Disconnected",
        description: "Broker has been disconnected successfully.",
      });

      fetchBrokers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testAngelOneConnection = async (brokerId: string) => {
    setTestingConnection(brokerId);
    try {
      const { data, error } = await supabase.functions.invoke('angel-one', {
        body: { action: 'fetchMarketData' }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Connection Successful",
          description: "Angel One credentials are working. Received live market data.",
        });
      } else {
        throw new Error(data?.error || "Failed to fetch market data");
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Angel One",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(null);
    }
  };

  if (loading) {
    return <div>Loading brokers...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Broker Connections</CardTitle>
              <CardDescription>Connect your trading accounts to enable automated execution</CardDescription>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Broker
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm ? (
            <form onSubmit={handleAddBroker} className="space-y-4">
              <div>
                <Label>Select Broker</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button
                    type="button"
                    variant={selectedBroker === "zerodha" ? "default" : "outline"}
                    className="h-20"
                    onClick={() => setSelectedBroker("zerodha")}
                  >
                    Zerodha Kite
                  </Button>
                  <Button
                    type="button"
                    variant={selectedBroker === "angel_one" ? "default" : "outline"}
                    className="h-20"
                    onClick={() => setSelectedBroker("angel_one")}
                  >
                    Angel One
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={credentials.apiSecret}
                  onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit">Connect Broker</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : brokers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No brokers connected. Click "Add Broker" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {brokers.map((broker) => (
                <div key={broker.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <div>
                      {broker.is_active ? (
                        <CheckCircle2 className="h-8 w-8 text-profit" />
                      ) : (
                        <XCircle className="h-8 w-8 text-destructive" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold capitalize">{broker.broker_type.replace("_", " ")}</div>
                      <div className="text-sm text-muted-foreground">
                        {broker.is_active ? "Connected" : "Disconnected"} • 
                        Last active: {new Date(broker.last_connected_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {broker.is_active ? (
                      <Badge variant="outline" className="bg-profit/10 text-profit border-profit/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Inactive
                      </Badge>
                    )}
                    {broker.is_active && broker.broker_type === "angel_one" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testAngelOneConnection(broker.id)}
                        disabled={testingConnection === broker.id}
                      >
                        {testingConnection === broker.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </Button>
                    )}
                    {broker.is_active && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnect(broker.id)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerIntegration;
