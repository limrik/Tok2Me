def keep_full_convos(ds):
    ds_full_convos = []

    for i in range(1, len(ds['train'])):
        if '<StartOfConversation>' in ds['train'][i]['0']:
            ds_full_convos.append(ds['train'][i-1]['0'])

    return ds_full_convos

def split_cust_sales(text):
    # Split by "Customer:" and "Serviceman:"
    parts = [segment.strip() for segment in text.split("Customer:") if segment]
    split_conversation = []

    for part in parts:
        if "Salesman:" in part:
            split_conversation.extend(part.split("Salesman:"))
        else:
            split_conversation.append(part)

    # Remove empty strings and strip extra whitespace
    split_conversation = [segment.strip() for segment in split_conversation if segment][1:]

    cust = [split_conversation[x] for x in range(0, len(split_conversation), 2)]

    sales = [split_conversation[x] for x in range(1, len(split_conversation), 2)]

    sales[-1] = sales[-1].split('\n')[0]
    
    full_cust = '\n'.join(cust)
    full_sales = '\n'.join(sales)

    full_cust = "Customer says to salesman: " + full_cust
    full_sales = "Salesman says to customer: " + full_sales
    
    return {
        "full": (full_cust, full_sales),
        "split": (cust, sales)
    }

def split_cust_sales_mock(convo):

    cust = [line['message'] for line in convo if line['role'] == 'customer']
    sales = [line['message'] for line in convo if line['role'] == 'salesman']

    full_cust = '\n'.join(cust)
    full_sales = '\n'.join(sales)

    full_cust = "Customer says to salesman: " + full_cust
    full_sales = "Salesman says to customer: " + full_sales 

    return {
        "full": (full_cust, full_sales),
        "split": (cust, sales)
    }