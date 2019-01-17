## RPC style communications between background and property inspector  

#### `.register()`
Register an RPC method handler  

#### `.invoke()`
Invokes an RPC method handler registered with the opposing layer.  
returns a promise that is fullfilled/rejected once the opposing layer responds

#### `.notify()`
Raises an event in the opposing layer


## Settings handling
Implement a key-value pair system for storing presistant settings.  
These values should be loaded for both the background and property inspector layers

#### `.store()`
Stores a value

#### `.retrieve()`
Retrieves the value associated with the specified key

#### `.remove()`
Removes a stored key and its value from the stored settings