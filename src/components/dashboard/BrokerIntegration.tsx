import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Plus, RefreshCw, Wallet } from "lucide-react";
import { brokerCredentialsSchema } from "@/lib/validation";

// Component to display broker funds
const BrokerFundsDisplay = ({ brokerId, brokerType, userId }: { brokerId: string; brokerType: string; userId: string }) => {
  const [funds, setFunds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) return;

        const res = await fetch(`${backendUrl}/getBrokerFunds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, brokerId }),
        });

        const data = await res.json();
        if (data.success && data.availableFunds !== undefined) {
          setFunds(data.availableFunds);
        }
      } catch (error) {
        console.error('Failed to fetch broker funds:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch with delay
    const initialTimeout = setTimeout(fetchFunds, 2000);
    
    // Refresh funds every 60 seconds (reduced from 30s to reduce load)
    const interval = setInterval(fetchFunds, 60000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [brokerId, userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="h-4 w-4" />
        <span>Loading funds...</span>
      </div>
    );
  }

  if (funds === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <Wallet className="h-4 w-4 text-primary" />
      <div>
        <div className="text-xs text-muted-foreground">Available Funds</div>
        <div className="text-lg font-semibold">
          ₹{new Intl.NumberFormat('en-IN').format(funds)}
        </div>
      </div>
    </div>
  );
};

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
    clientId: "",
    mpin: "",
    totpSecret: "",
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
      // Validate input
      const validatedData = brokerCredentialsSchema.parse({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        brokerType: selectedBroker,
      });

      // Call secure edge function to encrypt and store credentials
      const requestBody: any = {
        apiKey: validatedData.apiKey,
        apiSecret: validatedData.apiSecret,
        brokerType: validatedData.brokerType,
      };

      // Add Angel One specific fields
      if (selectedBroker === 'angel_one') {
        if (!credentials.clientId || !credentials.mpin || !credentials.totpSecret) {
          throw new Error('Angel One requires: Client ID, MPIN, and TOTP Secret');
        }
        requestBody.clientId = credentials.clientId;
        requestBody.mpin = credentials.mpin;
        requestBody.totpSecret = credentials.totpSecret;
        // Server IP that users need to whitelist
        requestBody.publicIp = '98.88.173.81';
      }

      const { data, error } = await supabase.functions.invoke('store-broker-credentials', {
        body: requestBody
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to invoke edge function');
      }
      
      if (!data) {
        throw new Error('No response from edge function');
      }
      
      if (!data.success) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error || 'Failed to store credentials');
      }

      toast({
        title: "Broker Connected",
        description: `${selectedBroker === "zerodha" ? "Zerodha" : "Angel One"} has been connected successfully with encrypted storage.`,
      });

      setCredentials({ apiKey: "", apiSecret: "", clientId: "", mpin: "", totpSecret: "" });
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
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetchMarketData' }),
        });
        const data = await res.json();
        if (data?.success) {
          toast({
            title: "Connection Successful",
            description: "Angel One credentials are working. Received live market data.",
          });
        } else {
          throw new Error(data?.error || "Failed to fetch market data");
        }
      } else {
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

              {/* Angel One Specific Fields */}
              {selectedBroker === "angel_one" && (
                <>
                  <div>
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      type="text"
                      value={credentials.clientId}
                      onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                      placeholder="Your Angel One Client ID"
                      required={selectedBroker === "angel_one"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mpin">MPIN (4 digits)</Label>
                    <Input
                      id="mpin"
                      type="password"
                      maxLength={4}
                      value={credentials.mpin}
                      onChange={(e) => setCredentials({ ...credentials, mpin: e.target.value.replace(/\D/g, '') })}
                      placeholder="0000"
                      required={selectedBroker === "angel_one"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="totpSecret">TOTP Secret (Base32)</Label>
                    <Input
                      id="totpSecret"
                      type="text"
                      value={credentials.totpSecret}
                      onChange={(e) => setCredentials({ ...credentials, totpSecret: e.target.value.toUpperCase() })}
                      placeholder="ABCD1234EFGH5678"
                      required={selectedBroker === "angel_one"}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Found in your SmartAPI app settings
                    </p>
                  </div>
                </>
              )}

              {/* Zerodha OAuth Note */}
              {selectedBroker === "zerodha" && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-sm font-semibold mb-1">Zerodha Kite Connect</div>
                  <p className="text-xs text-muted-foreground">
                    Zerodha uses OAuth authentication. No IP whitelisting required. 
                    You'll be redirected to Zerodha for authorization.
                  </p>
                </div>
              )}

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
                <Card key={broker.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">
                          {broker.is_active ? (
                            <CheckCircle2 className="h-6 w-6 text-profit" />
                          ) : (
                            <XCircle className="h-6 w-6 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold capitalize">{broker.broker_type.replace("_", " ")}</h3>
                            {broker.is_active ? (
                              <Badge variant="outline" className="bg-profit/10 text-profit border-profit/20">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            Connected: {new Date(broker.last_connected_at || broker.created_at).toLocaleDateString()}
                          </div>
                          {broker.is_active && <BrokerFundsDisplay brokerId={broker.id} brokerType={broker.broker_type} userId={userId} />}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerIntegration;
