cmd_Release/sourceId2Coordinates.node := c++ -bundle -undefined dynamic_lookup -Wl,-no_pie -Wl,-search_paths_first -mmacosx-version-min=10.10 -arch x86_64 -L./Release -stdlib=libc++  -o Release/sourceId2Coordinates.node Release/obj.target/sourceId2Coordinates/node_addons/sourceId2Coordinates/src/index.o Release/obj.target/sourceId2Coordinates/node_addons/sourceId2Coordinates/src/sourceId2Coordinates.o 
