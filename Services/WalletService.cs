using monster_world.Models;
using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace monster_world.Services
{
    // Deserialized by ASP.NET Core [FromBody] → needs System.Text.Json attributes
    public class TonWebhookPayload
    {
        [JsonPropertyName("account_id")]
        public string AccountId { get; set; }

        [JsonPropertyName("lt")]
        public long Lt { get; set; }

        [JsonPropertyName("tx_hash")]
        public string TxHash { get; set; }
    }

    // Deserialized manually via JsonConvert → needs Newtonsoft attributes
    public class TonTransaction
    {
        [JsonProperty("hash")]
        public string Hash { get; set; }

        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("utime")]
        public long Utime { get; set; }

        [JsonProperty("in_msg")]
        public TonMessage InMsg { get; set; }

        [JsonProperty("out_msgs")]
        public List<TonMessage> OutMsgs { get; set; }
    }

    public class TonTransactionsList
    {
        [JsonProperty("transactions")]
        public List<TonTransaction> Transactions { get; set; }
    }

    public class ToncenterResult
    {
        [JsonProperty("ok")]
        public bool Ok { get; set; }

        [JsonProperty("result")]
        public List<ToncenterTransaction> Result { get; set; }
    }

    public class ToncenterTransaction
    {
        [JsonProperty("utime")]
        public long Utime { get; set; }

        [JsonProperty("transaction_id")]
        public ToncenterTxId TransactionId { get; set; }

        [JsonProperty("in_msg")]
        public ToncenterMsg InMsg { get; set; }

        [JsonProperty("out_msgs")]
        public List<ToncenterMsg> OutMsgs { get; set; }
    }

    public class ToncenterTxId
    {
        [JsonProperty("hash")]
        public string Hash { get; set; }
    }

    public class ToncenterMsg
    {
        [JsonProperty("source")]
        public string Source { get; set; }

        [JsonProperty("destination")]
        public string Destination { get; set; }

        [JsonProperty("value")]
        public string Value { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }
    }

    public class TonMessage
    {
        [JsonProperty("value")]
        public long Value { get; set; }

        [JsonProperty("source")]
        public TonAddress Source { get; set; }

        [JsonProperty("destination")]
        public TonAddress Destination { get; set; }

        [JsonProperty("decoded_body")]
        public TonDecodedBody DecodedBody { get; set; }
    }

    public class TonDecodedBody
    {
        [JsonProperty("grams")]
        public string Grams { get; set; }

        [JsonProperty("text")]
        public string Text { get; set; }
    }

    public class TonAddress
    {
        [JsonProperty("address")]
        public string Address { get; set; }
    }


    public class WalletService
    {
        // public Deposit Deposit(UserBase User, double amount, TonWebhookPayload update)
        // {
        //     Deposit deposit = new()
        //     {
        //         UserID = User.ID,
        //         Amount = amount,
        //         Balance = User.Balance,
        //         Successful = false,
        //         Completed = false,
        //         Hash = update.TxHash,
        //         Time = ;
        //     };
        // }
    }
}
