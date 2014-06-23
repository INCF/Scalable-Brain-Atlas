function [data,tp] = json_decode(S,simplify,useStructs)
% [DATA,TP] = json_decode(S,SIMPLIFY,USESTRUCTS)
%
% This function decodes a JSON string and returns the data in a  
% tree of nested cells. Each cell has two columns.
% The second column specifies the (nested) data, the first specifies 
% the associated data type and key, separated by underscore.
% For json arrays, the key is omitted.
% The data type is one of these single characters:
%   s (string), a (array with numeric keys), h (hash/object), 
%   d (double scalar), v (vector of doubles), m (matrix of doubles)
%   b (boolean), or u (undefined/null)
%
% The nested cell structure is necessary to enable faithful 
% re-encoding of the JSON string; without it Matlab cannot distinguish 
% between a scalar, 1-element array or single-row matrix.
%
% If SIMPLIFY is set to 1 or TRUE (the default), json_decode simplifies the 
% tree of nested cells:
% - an array of doubles is converted to a numeric vector
% - an array of equal-length vectors is converted to a matrix
% - if all array elements have the same type, then the type-column 
%   is omitted, and the type is stored by the parent cell.
%
% If USESTRUCTS is set to 1 or TRUE (the default), then all
% cells representing json objects are converted to Matlab structs,
% but only if all fieldnames of the json object contain nothing but 
% letters, numbers and underscores. The fieldnames of the struct
% are prefixed by data type + underscore.
%
% json_decode is invertible, in that [S] = json_encode(data,tp)
% reconstructs S (formatting may differ).
%
% [TP_DATA] = json_decode(S,SIMPLIFY,USESTRUCT)
% 
% When called with a single output, json_decode wraps the data as a 1x2
% cell array {tp,data}, which is invertible by S = json_encode(TP_DATA)
%
% R. Bakker, 2011
% heavily borrowing from
% F. Glineur, 2009
% who was in turn inspired by the JSON parser by Joel Feenstra on 
% MATLAB File Exchange
% (http://www.mathworks.com/matlabcentral/fileexchange/20565)
%

if nargin<2, simplify=true; end
if nargin<3, useStructs=true; end

pos = 1;
len = length(S);
% String delimiters and escape characters are identified beforehand to improve speed
esc = regexp(S, '["\\]'); index_esc = 1; len_esc = length(esc);

[data,tp] = parse_value;
if nargout==1,
  data = {tp,data};
end

function obj = parse_object
	parse_char('{');
	obj = cell(0,2);
	if next_char ~= '}'
		while 1
			str = parse_string;
			if isempty(str)
				error_pos('Name of value at position %d cannot be empty');
			end
			parse_char(':');
			[val,tp] = parse_value;
			obj(end+1,:) = {[tp '_' str],val};
			if next_char == '}'
				break;
			end
			parse_char(',');
		end
	end
	parse_char('}');
	if (useStructs),
		% convert nx2 cell to struct only if fields contain no invalid characters
		if ~numel(obj) || isempty(invalid_chars(strcat(obj{:,1}))) 
			obj = cell2struct(obj(:,2),obj(:,1)); 
		end
  end
end

function obj = parse_array
	parse_char('[');
	obj = cell(0,2);
	if next_char ~= ']'
		while 1
			[val,tp] = parse_value;
			obj(end+1,:) = {tp,val}; % no need to validate characters here
			if next_char == ']'
				break;
			end
			parse_char(',');
		end
	end
	parse_char(']');
end

function parse_char(c)
	skip_whitespace;
	if pos > len || S(pos) ~= c
		error_pos(sprintf('Expected %c at position %%d', c));
	else
		pos = pos + 1;
		skip_whitespace;
	end
end

function c = next_char
	skip_whitespace;
	if pos > len
		c = [];
	else
		c = S(pos);
	end        
end
    
function skip_whitespace
	while pos <= len && isspace(S(pos))
		pos = pos + 1;
	end
end

function str = parse_string
	if S(pos) ~= '"'
		error_pos('String starting with " expected at position %d');
	else
		pos = pos + 1;
	end
	str = '';
	while pos <= len
		while index_esc <= len_esc && esc(index_esc) < pos 
			index_esc = index_esc + 1;
		end
		if index_esc > len_esc
			str = [str S(pos:end)];
			pos = len + 1;
			break;
		else
			str = [str S(pos:esc(index_esc)-1)];
			pos = esc(index_esc);
		end
		switch S(pos)
		case '"' 
			pos = pos + 1;
			return;
		case '\'
			if pos+1 > len
				error_pos('End of file reached right after escape character');
			end
			pos = pos + 1;
			switch S(pos)
			case {'"' '\' '/'}
				str(end+1) = S(pos);
				pos = pos + 1;
			case {'b' 'f' 'n' 'r' 't'}
				str(end+1) = sprintf(['\' S(pos)]);
				pos = pos + 1;
			case 'u'
				if pos+4 > len
					error_pos('End of file reached in escaped unicode character');
				end
				str(end+1:end+6) = S(pos-1:pos+4);
				pos = pos + 5;
			end
		otherwise % should never happen
			str(end+1) = S(pos);
			pos = pos + 1;
		end
	end
	error_pos('End of file while expecting end of S');
end

function num = parse_number
	[num, one, err, delta] = sscanf(S(pos:min(len,pos+20)), '%f', 1); % TODO : compare with json(pos:end)
	if ~isempty(err)
		error_pos('Error reading number at position %d');
	end
	pos = pos + delta-1;
end

function [val,tp] = parse_value
	switch(S(pos))
	case '"'
		val = parse_string;
		tp = 's';
		return;
	case '['
		val = parse_array;
		if simplify && size(val,1)>0,
			% special case: all members are vectors of the same length, simplify to matrix
			if val{1,1} == 'v',
				M = val{1,2};
				try
					for i=2:size(val,1), 
						if val{i,1} ~= 'v', error; end
						M(:,i) = val{i,2}; 
					end
					val = M;
					tp = 'm';
					return;
				catch
				end
			end
			% special case: all members are double, simplify to row vector
			if val{1,1} == 'd',
				V = val{1,2};
				try
					for i=2:size(val,1), 
						if val{i,1} ~= 'd', error; end
						V(i) = val{i,2};
					end
					val = V;
					tp = 'v';
					return;
				catch
				end
			end
			% if all members have the same type, simplify to cell array
			try
  			f11 = val{1,1};
  			if f11 ~= 'a' && f11 ~= 'h',
  				for i=2:size(val,1),
  					if val{i,1} ~= f11, error; end
  				end
  				val = val(:,2);
  				tp = f11;
  				return;
  		  end
			catch
			end
	  end
		tp = 'a';
		return;
	case '{'
		val = parse_object;
		tp = 'h';
		return;
	case {'-','0','1','2','3','4','5','6','7','8','9'}
		val = parse_number;
		tp = 'd';
		return;
	case 't'
		if pos+3 <= len && strcmpi(S(pos:pos+3), 'true')
			val = true;
			tp = 'b';
			pos = pos + 4;
			return;
		end
	case 'f'
		if pos+4 <= len && strcmpi(S(pos:pos+4), 'false')
			val = false;
			tp = 'b';
			pos = pos + 5;
			return;
		end
	case 'n'
		if pos+3 <= len && strcmpi(S(pos:pos+3), 'null')
			val = [];
			tp = 'n';
			pos = pos + 4;
			return;
		end
	end
	error_pos('Value expected at position %d');
end

function error_pos(msg)
	poss = max(min([pos-15 pos-1 pos pos+20],[len len len len]),[1 1 1 1]);
	if poss(3) == poss(2)
		poss(2) = poss(1)-1; % display nothing before
	end
	msg = [sprintf(msg, pos) ' : ... ' S(poss(1):poss(2)) '<error>' S(poss(3):poss(4)) ' ... '];
	ME = MException('JSONparser:invalidFormat', msg);
	throw(ME);
end

% From MATLAB doc: field names must begin with a letter, which may be
% followed by any combination of letters, digits, and underscores.
% Any other character is invalid.
function pos = invalid_chars(str)   
  pos = find(~isletter(str) & ~('0' <= str & str <= '9') & str ~='_');   
end

end