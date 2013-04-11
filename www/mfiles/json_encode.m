function S = json_encode(data,tp,noindent,depth)
% function S = json_encode(DATA,TP)
%
% Returns the inverse of json_decode in string S.
% Inputs:
% - DATA: must follow the output rules of json_decode.
% - TP: the single-character data type, see json_decode, 
%       can be omitted if data is wrapped as a cell array {TP,DATA}
%
% Some sloppy use of json_encode(data) is allowed, simple heuristics
% detect whether DATA contains a string, scalar, vector or matrix.
%
% Rembrandt Bakker, 2011
%

if nargin<2, tp='?'; end
if nargin<3, noindent=false; end
if nargin<4, depth=0; end

if tp == '?',
  % Normally, either tp is specified or the data is wrapped in a cell {tp,data}
  % Some sloppy usage is allowed: strings, scalars, vectors and matrices can be specified without tp
  if iscell(data) && size(data,1)==1 && size(data,1)==1,
    tp = data{1};
    data = data{2};
  elseif ischar(data),
    tp = 's';
  elseif isnumeric(data),
    if numel(data) ==1, tp = 'd',
    elseif numel(data)==length(data), tp = 'v',
    elseif numel(size(data)) == 2, tp = 'm'
    end
  end
  if tp ~= '?'
    S = json_encode(data,tp,noindent,depth);
    return;
  end
end

if isstruct(data)
  % convert to two-column cell
  keys = fieldnames(data);
  data = [keys,struct2cell(data)];
  tp = 'h';
end

if iscell(data) && tp ~= 'a'  && tp ~= 'h',
  S = '[';
  nI = numel(data);
  for i=1:nI,
    v = data{i};
    q = json_encode(v,tp,noindent,depth);
    S(end+1:end+numel(q)) = q;
    if i<nI, S(end+1) = sprintf(','); end
  end
  S(end+1) = ']';
else
  switch tp,
  case {'a','h'}, % array with 0-based numeric ('a') or string ('h') keys, mixed type values
    if tp=='h' delim='{}'; else delim='[]'; end
    if iscell(data) && size(data,2) == 2,
      indent = ~noindent;
      if tp=='a' && size(data,1)>0,
        types = strcat(data{:,1});
        if isempty(find(types=='a' | types=='h' | types=='m')),
          indent = false;
        end
      end
      S = delim(1);
   		if indent, S(end+1) = sprintf('\n'); end
      nI = size(data,1);
			for i=1:nI,
        if indent, S(end+1:end+2*depth+2) = ' '; end
        if tp=='h',
          key = data{i,1}(3:end);
          S = [S '"' key '":'];
        end
				pf = data{i,1}(1);
				S = [S json_encode(data{i,2},pf,noindent,depth+1)];
				if i<nI, S(end+1) = ',';  end
				if indent, S(end+1) = sprintf('\n'); end
			end
			if indent, S(end+1:end+2*depth) = ' '; end
			S(end+1) = delim(2);
		else
      err('expecting cell with two columns, but got ');  
		end
  case 'm', % matrix, numerical values
    if isnumeric(data) && numel(size(data)) == 2,
      indent = ~noindent;
   		if indent, S = sprintf('[\n'); end
			nI = size(data,1);
			for i=1:nI,
    	  if indent, S(end+1:end+2*depth+2) = ' '; end
				v = data(i,:);
				q = json_encode(v,'v',noindent,depth+1);
				S(end+1:end+numel(q)) = q;
				if i<nI, S(end+1) = ',';  end
				if indent, S(end+1) = sprintf('\n'); end
			end
			if indent, S(end+1:end+2*depth) = ' '; end
			S(end+1) = ']';
    else
      err('numeric matrix expected, but got ');  
    end
  case 'v',
    if isnumeric(data) && numel(data) == length(data),
      S = '[';
			nI = numel(data);			
			for i=1:nI,
				v = data(i);
				q = json_encode(v,'d',noindent,depth);
				S(end+1:end+numel(q)) = q;
				if i<nI, S(end+1) = sprintf(','); end
			end
			S(end+1) = ']';
    else
      err('numeric vector expected, but got ');  
    end
  case 'd',
    if isnumeric(data) && numel(data) == 1,
      S = num2str(data);
    else
      err('1x1 numeric expected, but got ');  
    end
  case 's',
    if ischar(data),
      S = ['"' strrep(strrep(data,'"','\"'),char(10),'\n') '"'];
    else
      err('string expected, but got ');  
    end
  case 'b',
    if isnumeric(data) && numel(data) == 1,
      if (~data) S = 'false'; else S = 'true'; end
    else
      err('1x1 boolean expected, but got ');  
    end
  case 'n',
    if numel(data) == 0,
      S = 'null';
    else
      err('empty matrix (null) expected, but got ');  
    end
  otherwise,
    err(['unsupported tp; ']);
  end
end

function err(msg)
  error(['tp "' tp '": ' msg class(data) ' of size [' num2str(size(data)) ']']);
  % ['empty matrix (null) expected, but got ' class(data) ' of size ' num2str(size(data))]
end

end