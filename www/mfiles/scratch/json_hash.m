classdef json_hash
  properties
    data;
  end
  methods
    function obj = json_hash(C)
      if ~iscell(C) || size(C,2) ~= 2, error('json_hash must be constructed with a 2 column cell array'); end
      obj.data = C;
    end
    function v = colon(obj,k)
      v = 'test';
    end
  end
end